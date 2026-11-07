import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTestDatabaseEnvironment } from "./e2e-environment";

/**
 * A member the owner removed has status `kicked`; a member who left has `removed`.
 * The join page reads this status to decide whether to show the "you were removed"
 * popup. Removing a member keeps their progress, and adding them back restores it.
 * Runs against the local `rhythm_test` database only (see tests/e2e/README.md).
 * It creates two users and one plan and deletes them at the end.
 *
 *   pnpm exec tsx --test scripts/plan-member-status.test.ts
 */
const settings = loadTestDatabaseEnvironment();
process.env.DATABASE_URL = settings.DATABASE_URL;
process.env.DATABASE_PROVIDER = "local";
process.env.SESSION_SECRET = settings.SESSION_SECRET || "test-only";

type Modules = {
  db: typeof import("@/src/db").db;
  schema: typeof import("@/src/db/schema");
  orm: typeof import("drizzle-orm");
  queries: typeof import("@/src/features/plans/queries");
  membership: typeof import("@/src/features/plans/membership");
  program: typeof import("@/src/features/content/program");
};
let m: Modules;
let ownerId: number;
let memberId: number;
let planId: string;

async function setStatus(status: string) {
  const { and, eq } = m.orm;
  const t = m.schema.planMembers;
  await m.db
    .update(t)
    .set({ status })
    .where(and(eq(t.planId, planId), eq(t.userId, memberId)));
}

before(async () => {
  m = {
    db: (await import("@/src/db")).db,
    schema: await import("@/src/db/schema"),
    orm: await import("drizzle-orm"),
    queries: await import("@/src/features/plans/queries"),
    membership: await import("@/src/features/plans/membership"),
    program: await import("@/src/features/content/program"),
  };
  const stamp = Date.now();
  const [owner, member] = await m.db
    .insert(m.schema.users)
    .values([
      { email: `member-status-owner-${stamp}@example.com` },
      { email: `member-status-member-${stamp}@example.com` },
    ])
    .returning();
  ownerId = owner.id;
  memberId = member.id;
  const [plan] = await m.db
    .insert(m.schema.plans)
    .values({
      blockNumber: 1,
      createdBy: ownerId,
      inviteCode: `member-status-${stamp}`,
      isGroup: true,
    })
    .returning();
  planId = plan.id;
  await m.db.insert(m.schema.planMembers).values([
    { planId, userId: ownerId, role: "owner" },
    { planId, userId: memberId },
  ]);
});

after(async () => {
  const { eq, inArray } = m.orm;
  if (planId) await m.db.delete(m.schema.plans).where(eq(m.schema.plans.id, planId));
  const ids = [ownerId, memberId].filter(Boolean);
  if (ids.length) await m.db.delete(m.schema.users).where(inArray(m.schema.users.id, ids));
  // Close the pool so the test process can end; this keeps real failures visible.
  await (m.db as unknown as { $client?: { end(): Promise<void> } }).$client?.end();
});

test("the status tells active, left, removed-by-owner and never-joined apart", async () => {
  const { getPlanMemberStatus } = m.queries;
  assert.equal(await getPlanMemberStatus(planId, memberId), "active");
  await setStatus("removed");
  assert.equal(await getPlanMemberStatus(planId, memberId), "removed");
  await setStatus("kicked");
  assert.equal(await getPlanMemberStatus(planId, memberId), "kicked");
  assert.equal(await getPlanMemberStatus(planId, 2_000_000_000), null);
});

async function progressRows() {
  const { and, eq } = m.orm;
  const t = m.schema.taskCompletions;
  return m.db
    .select({ taskId: t.taskId })
    .from(t)
    .where(and(eq(t.planId, planId), eq(t.userId, memberId)));
}

test("removing a member keeps their progress, and adding them back restores it", async () => {
  const { kickMember, reinstateMember } = m.membership;
  const { getPlanMemberStatus, getActivePlanMembership } = m.queries;
  await setStatus("active");
  const task = m.program.getDayTasks(1, 1)[0];
  assert.ok(task, "block 1 day 1 has a task");
  await m.db.insert(m.schema.taskCompletions).values({
    userId: memberId,
    planId,
    taskId: task.id,
    data: {},
  });
  await m.db.insert(m.schema.planCompletions).values({ planId, userId: memberId });

  await kickMember(planId, memberId);
  assert.equal(await getPlanMemberStatus(planId, memberId), "kicked");
  // The member is out of the plan, but nothing they did is deleted.
  assert.equal(await getActivePlanMembership(planId, memberId), null);
  assert.deepEqual(
    (await progressRows()).map((row) => row.taskId),
    [task.id],
  );

  assert.equal(await reinstateMember(planId, memberId), "restored");
  assert.equal(await getPlanMemberStatus(planId, memberId), "active");
  assert.ok(await getActivePlanMembership(planId, memberId));
  assert.deepEqual(
    (await progressRows()).map((row) => row.taskId),
    [task.id],
  );
  const { and, eq } = m.orm;
  const finished = await m.db
    .select({ id: m.schema.planCompletions.id })
    .from(m.schema.planCompletions)
    .where(
      and(
        eq(m.schema.planCompletions.planId, planId),
        eq(m.schema.planCompletions.userId, memberId),
      ),
    );
  assert.equal(finished.length, 1);
});

test("adding back an active member changes nothing, and a new person is added", async () => {
  const { reinstateMember } = m.membership;
  assert.equal(await reinstateMember(planId, memberId), "already");
  const [stranger] = await m.db
    .insert(m.schema.users)
    .values({ email: `member-status-stranger-${Date.now()}@example.com` })
    .returning();
  try {
    assert.equal(await reinstateMember(planId, stranger.id), "added");
    assert.equal(await m.queries.getPlanMemberStatus(planId, stranger.id), "active");
  } finally {
    await m.db.delete(m.schema.users).where(m.orm.eq(m.schema.users.id, stranger.id));
  }
});

test("a member who left can be brought back by the owner too", async () => {
  await setStatus("removed");
  assert.equal(await m.membership.reinstateMember(planId, memberId), "restored");
  assert.equal(await m.queries.getPlanMemberStatus(planId, memberId), "active");
});

test("a plan id from the URL that is not a UUID is treated as not found", async () => {
  assert.equal(await m.queries.getPlanForMember("abc", ownerId), null);
  assert.ok(await m.queries.getPlanForMember(planId, ownerId));
});
