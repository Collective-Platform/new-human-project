import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { after, before, test } from "node:test";
import { loadTestDatabaseEnvironment } from "./e2e-environment";
import { legacyActiveBlock, legacyBlockEnd } from "./legacy-block-schedule";

/**
 * Runs the real legacy plan script against the local `rhythm_test` database only
 * (see tests/e2e/README.md). The script reads every user in that database. This test
 * creates one user with a finished block and deletes them at the end.
 *
 *   pnpm exec tsx --test scripts/migrate-legacy-plans.test.ts
 */
const settings = loadTestDatabaseEnvironment();
process.env.DATABASE_URL = settings.DATABASE_URL;
process.env.DATABASE_PROVIDER = "local";
process.env.SESSION_SECRET = settings.SESSION_SECRET || "test-only";

const FINISHED_AT = new Date("2026-06-26T10:30:00.000Z");
const ONBOARDED_AT = new Date("2026-06-01T00:00:00.000Z");

type Modules = {
  db: typeof import("@/src/db").db;
  schema: typeof import("@/src/db/schema");
  orm: typeof import("drizzle-orm");
  program: typeof import("@/src/features/content/program");
};
let m: Modules;
let userId: number;
let taskId: string;

// The script runs in its own process, without dotenv, so `.env.local` is never read.
async function runScript() {
  await promisify(execFile)("pnpm", ["exec", "tsx", "scripts/migrate-legacy-plans.ts"], {
    env: { ...process.env, ...settings },
    timeout: 60_000,
  });
}

async function legacyCompletion() {
  const { and, eq } = m.orm;
  const { planCompletions, plans } = m.schema;
  const [row] = await m.db
    .select({ planId: plans.id, completedAt: planCompletions.completedAt })
    .from(planCompletions)
    .innerJoin(plans, eq(planCompletions.planId, plans.id))
    .where(and(eq(planCompletions.userId, userId), eq(plans.inviteCode, `legacy-${userId}-1`)));
  return row;
}

before(async () => {
  m = {
    db: (await import("@/src/db")).db,
    schema: await import("@/src/db/schema"),
    orm: await import("drizzle-orm"),
    program: await import("@/src/features/content/program"),
  };
  const [user] = await m.db
    .insert(m.schema.users)
    .values({
      email: `legacy-plan-${Date.now()}@example.invalid`,
      onboardedAt: ONBOARDED_AT,
    })
    .returning();
  userId = user.id;
  await m.db
    .insert(m.schema.memberBlockCompletions)
    .values({ userId, blockNumber: 1, completedAt: FINISHED_AT });
  taskId = m.program.getDayTasks(1, 1)[0].id;
  await m.db.insert(m.schema.taskCompletions).values({ userId, taskId, data: {} });
  await runScript();
});

after(async () => {
  const { eq } = m.orm;
  if (userId) await m.db.delete(m.schema.users).where(eq(m.schema.users.id, userId));
  await (m.db as unknown as { $client?: { end(): Promise<void> } }).$client?.end();
});

test("a finished block keeps the date the member really finished it", async () => {
  const row = await legacyCompletion();
  assert.equal(row?.completedAt.toISOString(), FINISHED_AT.toISOString());
});

test("an old task completion is linked to the legacy plan", async () => {
  const { eq } = m.orm;
  const [row] = await m.db
    .select({ planId: m.schema.taskCompletions.planId })
    .from(m.schema.taskCompletions)
    .where(eq(m.schema.taskCompletions.userId, userId));
  assert.equal(row.planId, (await legacyCompletion()).planId);
});

test("every block before the current one is completed by time, with no badge", async () => {
  const { eq } = m.orm;
  const { memberBadges, planCompletions, plans } = m.schema;
  const rows = await m.db
    .select({ blockNumber: plans.blockNumber, completedAt: planCompletions.completedAt })
    .from(plans)
    .leftJoin(planCompletions, eq(planCompletions.planId, plans.id))
    .where(eq(plans.createdBy, userId));
  const current = legacyActiveBlock(ONBOARDED_AT).blockNumber;
  assert.ok(current > 2, "the member should be past at least two blocks");
  for (let block = 2; block < current; block++) {
    const row = rows.find((candidate) => candidate.blockNumber === block);
    assert.equal(row?.completedAt?.getTime(), legacyBlockEnd(ONBOARDED_AT, block).getTime());
  }
  assert.equal(rows.find((row) => row.blockNumber === current)?.completedAt ?? null, null);
  const badges = await m.db.select().from(memberBadges).where(eq(memberBadges.userId, userId));
  assert.equal(badges.length, 0);
});

test("a second run keeps the finished date of a block with no old milestone", async () => {
  const { and, eq } = m.orm;
  const { planCompletions, plans } = m.schema;
  const [plan] = await m.db
    .select({ id: plans.id })
    .from(plans)
    .where(and(eq(plans.createdBy, userId), eq(plans.blockNumber, 2)));
  const finishedInApp = new Date("2026-09-01T00:00:00.000Z");
  await m.db
    .update(planCompletions)
    .set({ completedAt: finishedInApp })
    .where(eq(planCompletions.planId, plan.id));
  await runScript();
  const [row] = await m.db
    .select({ completedAt: planCompletions.completedAt })
    .from(planCompletions)
    .where(eq(planCompletions.planId, plan.id));
  assert.equal(row.completedAt.getTime(), finishedInApp.getTime());
});

test("a second run adds no rows and repairs a wrong date", async () => {
  const { eq } = m.orm;
  const { planCompletions, plans } = m.schema;
  const before = await legacyCompletion();
  await m.db
    .update(planCompletions)
    .set({ completedAt: new Date() })
    .where(eq(planCompletions.planId, before.planId));
  const countPlans = async () =>
    (await m.db.select({ id: plans.id }).from(plans).where(eq(plans.createdBy, userId))).length;
  const plansBefore = await countPlans();

  await runScript();

  const row = await legacyCompletion();
  assert.equal(row.planId, before.planId);
  assert.equal(row.completedAt.toISOString(), FINISHED_AT.toISOString());
  assert.equal(await countPlans(), plansBefore);
});
