import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTestDatabaseEnvironment } from "./e2e-environment";

/**
 * Mood and exercise logs are shared between a member's active blocks by calendar
 * date. Runs against the local `rhythm_test` database only (see tests/e2e/README.md).
 * It creates one user with three blocks and deletes them at the end.
 *
 *   pnpm exec tsx --test scripts/shared-logs.test.ts
 */
const settings = loadTestDatabaseEnvironment();
process.env.DATABASE_URL = settings.DATABASE_URL;
process.env.DATABASE_PROVIDER = "local";
process.env.SESSION_SECRET = settings.SESSION_SECRET || "test-only";

const TZ = "UTC";
const DAY = 86_400_000;

type Modules = {
  db: typeof import("@/src/db").db;
  schema: typeof import("@/src/db/schema");
  orm: typeof import("drizzle-orm");
  shared: typeof import("@/src/features/tasks/shared-logs");
  program: typeof import("@/src/features/content/program");
};
let m: Modules;
let userId: number;
const planIds: string[] = [];

type TestPlan = { id: string; blockNumber: number; startedAt: Date };
let blockA: TestPlan; // started 3 days ago: today is Day 4
let blockB: TestPlan; // started 1 day ago: today is Day 2

async function makePlan(blockNumber: number, startedDaysAgo: number): Promise<TestPlan> {
  const [plan] = await m.db
    .insert(m.schema.plans)
    .values({
      blockNumber,
      createdBy: userId,
      inviteCode: `shared-logs-${blockNumber}-${Date.now()}`,
      startedAt: new Date(Date.now() - startedDaysAgo * DAY),
    })
    .returning();
  planIds.push(plan.id);
  await m.db.insert(m.schema.planMembers).values({ planId: plan.id, userId, role: "owner" });
  return { id: plan.id, blockNumber, startedAt: plan.startedAt };
}

function taskOf(block: number, day: number, type: string) {
  const task = m.program.getDayTasks(block, day).find((item) => item.type === type);
  assert.ok(task, `block ${block} day ${day} has no ${type} task`);
  return task;
}

async function readRow(planId: string, taskId: string) {
  const { and, eq } = m.orm;
  const t = m.schema.taskCompletions;
  const [row] = await m.db
    .select({ data: t.data })
    .from(t)
    .where(and(eq(t.userId, userId), eq(t.planId, planId), eq(t.taskId, taskId)));
  return row ? ((row.data ?? {}) as Record<string, unknown>) : null;
}

/** Same write the real `completeTask` makes before it copies the log. */
async function saveRow(planId: string, taskId: string, data: Record<string, unknown>) {
  const t = m.schema.taskCompletions;
  await m.db
    .insert(t)
    .values({ userId, planId, taskId, data })
    .onConflictDoUpdate({
      target: [t.planId, t.userId, t.taskId],
      targetWhere: m.orm.sql`plan_id IS NOT NULL`,
      set: { data },
    });
}

const mirror = (source: TestPlan, task: ReturnType<typeof taskOf>) =>
  m.shared.mirrorSharedLog({ userId, source, task, timezone: TZ }).then((r) => r.planIds);
const remove = (source: TestPlan, task: ReturnType<typeof taskOf>) =>
  m.shared.removeSharedLog({ userId, source, task, timezone: TZ });

before(async () => {
  m = {
    db: (await import("@/src/db")).db,
    schema: await import("@/src/db/schema"),
    orm: await import("drizzle-orm"),
    shared: await import("@/src/features/tasks/shared-logs"),
    program: await import("@/src/features/content/program"),
  };
  const [user] = await m.db
    .insert(m.schema.users)
    .values({ email: `shared-logs-${Date.now()}@example.com` })
    .returning();
  userId = user.id;
  blockA = await makePlan(1, 3);
  blockB = await makePlan(2, 1);
});

after(async () => {
  const { inArray, eq } = m.orm;
  if (planIds.length) await m.db.delete(m.schema.plans).where(inArray(m.schema.plans.id, planIds));
  if (userId) await m.db.delete(m.schema.users).where(eq(m.schema.users.id, userId));
  // Close the pool so the test process can end; this keeps real failures visible.
  await (m.db as unknown as { $client?: { end(): Promise<void> } }).$client?.end();
});

test("a mood log saved today is copied to another block and marked as a copy", async () => {
  const moodA = taskOf(1, 4, "mood_log");
  const moodB = taskOf(2, 2, "mood_log");
  await saveRow(blockA.id, moodA.id, { entries: [{ moods: ["joy"] }] });
  assert.deepEqual(await mirror(blockA, moodA), [blockB.id]);
  const copy = await readRow(blockB.id, moodB.id);
  assert.deepEqual(copy?.entries, [{ moods: ["joy"] }]);
  assert.equal(copy?.syncedFromPlanId, blockA.id);
  assert.equal((await readRow(blockA.id, moodA.id))?.syncedFromPlanId, undefined);
});

test("an edit reaches the other block from either side, and original and copy keep their roles", async () => {
  const moodA = taskOf(1, 4, "mood_log");
  const moodB = taskOf(2, 2, "mood_log");
  await saveRow(blockA.id, moodA.id, { entries: [{ moods: ["joy"] }, { moods: ["peace"] }] });
  await mirror(blockA, moodA);
  assert.deepEqual((await readRow(blockB.id, moodB.id))?.entries, [
    { moods: ["joy"] },
    { moods: ["peace"] },
  ]);

  const copy = await readRow(blockB.id, moodB.id);
  await saveRow(blockB.id, moodB.id, { ...copy, entries: [{ moods: ["calm"] }] });
  await mirror(blockB, moodB);
  const original = await readRow(blockA.id, moodA.id);
  assert.deepEqual(original?.entries, [{ moods: ["calm"] }]);
  assert.equal(original?.syncedFromPlanId, undefined);
  assert.equal((await readRow(blockB.id, moodB.id))?.syncedFromPlanId, blockA.id);
});

test("several exercise entries in one day all reach the other block", async () => {
  const exA = taskOf(1, 4, "exercise");
  const exB = taskOf(2, 2, "exercise");
  const entries = [{ sportKey: "run" }, { sportKey: "swimming" }, { sportKey: "pilates" }];
  await saveRow(blockA.id, exA.id, { entries });
  await mirror(blockA, exA);
  assert.deepEqual((await readRow(blockB.id, exB.id))?.entries, entries);
});

test("a backfilled day reaches the block that was running on the same date", async () => {
  // Day 3 of block A is the same calendar date as Day 1 of block B.
  const backfillA = taskOf(1, 3, "mood_log");
  const backfillB = taskOf(2, 1, "mood_log");
  await saveRow(blockA.id, backfillA.id, { entries: [{ moods: ["tired"] }] });
  assert.deepEqual(await mirror(blockA, backfillA), [blockB.id]);
  assert.ok(await readRow(blockB.id, backfillB.id));

  assert.deepEqual(await remove(blockA, backfillA), [blockB.id]);
  assert.equal(await readRow(blockB.id, backfillB.id), null);
});

test("a date before the other block started, and a future day, are not copied", async () => {
  const beforeB = taskOf(1, 1, "mood_log");
  await saveRow(blockA.id, beforeB.id, { entries: [{ moods: ["joy"] }] });
  assert.deepEqual(await mirror(blockA, beforeB), []);

  const future = taskOf(1, 5, "mood_log");
  await saveRow(blockA.id, future.id, { entries: [{ moods: ["joy"] }] });
  assert.deepEqual(await mirror(blockA, future), []);
});

test("devotional tasks are never shared", async () => {
  const devotional = m.program.getDayTasks(1, 4).find((item) => item.type === "devotional");
  assert.ok(devotional);
  await saveRow(blockA.id, devotional.id, { note: "mine" });
  assert.deepEqual(await mirror(blockA, devotional), []);
});

test("removing today's log removes the copy", async () => {
  const moodA = taskOf(1, 4, "mood_log");
  const moodB = taskOf(2, 2, "mood_log");
  assert.deepEqual(await remove(blockA, moodA), [blockB.id]);
  assert.equal(await readRow(blockB.id, moodB.id), null);
});

test("a block started mid-day receives today's mood and exercise", async () => {
  const moodA = taskOf(1, 4, "mood_log");
  await saveRow(blockA.id, moodA.id, { entries: [{ moods: ["joy"] }] });
  const blockC = await makePlan(3, 0);
  await m.shared.copyTodaysLogsIntoPlan({ userId, plan: blockC, timezone: TZ });
  const mood = await readRow(blockC.id, taskOf(3, 1, "mood_log").id);
  assert.deepEqual(mood?.entries, [{ moods: ["joy"] }]);
  assert.equal(mood?.syncedFromPlanId, blockA.id);
});

test("a block past its 25 days neither receives nor sends copies, and keeps its own Day 25 log", async () => {
  // Started 40 days ago and not finished: the block opens on Day 25.
  const stale = await makePlan(3, 40);
  const staleMood = taskOf(3, 25, "mood_log");
  const moodA = taskOf(1, 4, "mood_log");
  await saveRow(stale.id, staleMood.id, { entries: [{ moods: ["day-25"] }] });

  await saveRow(blockA.id, moodA.id, { entries: [{ moods: ["good"] }] });
  assert.ok(!(await mirror(blockA, moodA)).includes(stale.id));
  assert.deepEqual(await readRow(stale.id, staleMood.id), { entries: [{ moods: ["day-25"] }] });

  await saveRow(stale.id, staleMood.id, { entries: [{ moods: ["calm"] }] });
  assert.deepEqual(await mirror(stale, staleMood), []);
  assert.deepEqual((await readRow(blockA.id, moodA.id))?.entries, [{ moods: ["good"] }]);

  // Removing today's log must not delete the old block's Day 25 log.
  await remove(blockA, moodA);
  assert.deepEqual(await readRow(stale.id, staleMood.id), { entries: [{ moods: ["calm"] }] });

  // With no log today anywhere else, a new block must not take the old block's Day 25 log.
  await m.db
    .delete(m.schema.taskCompletions)
    .where(
      m.orm.and(
        m.orm.eq(m.schema.taskCompletions.planId, blockA.id),
        m.orm.eq(m.schema.taskCompletions.taskId, moodA.id),
      ),
    );
  const fresh = await makePlan(6, 0);
  await m.shared.copyTodaysLogsIntoPlan({ userId, plan: fresh, timezone: TZ });
  assert.equal(await readRow(fresh.id, taskOf(6, 1, "mood_log").id), null);
});

test("a block started later points to the original, not to another copy", async () => {
  await m.db
    .delete(m.schema.taskCompletions)
    .where(m.orm.eq(m.schema.taskCompletions.userId, userId));
  const moodA = taskOf(1, 4, "mood_log");
  await saveRow(blockA.id, moodA.id, { entries: [{ moods: ["origin"] }] });
  await mirror(blockA, moodA);
  // Block B now holds a copy. Block E starts later and copies the newest row.
  const blockE = await makePlan(5, 0);
  await m.shared.copyTodaysLogsIntoPlan({ userId, plan: blockE, timezone: TZ });
  const copy = await readRow(blockE.id, taskOf(5, 1, "mood_log").id);
  assert.deepEqual(copy?.entries, [{ moods: ["origin"] }]);
  assert.equal(copy?.syncedFromPlanId, blockA.id);

  // An edit saved in a copy also points new copies to the original.
  const moodB = taskOf(2, 2, "mood_log");
  const copyB = await readRow(blockB.id, moodB.id);
  await saveRow(blockB.id, moodB.id, { ...copyB, entries: [{ moods: ["edited"] }] });
  await mirror(blockB, moodB);
  assert.equal(
    (await readRow(blockE.id, taskOf(5, 1, "mood_log").id))?.syncedFromPlanId,
    blockA.id,
  );
});

test("before a block is removed, exactly one copy of its log becomes the original", async () => {
  // Start clean: earlier tests left logs whose original-or-copy roles would be kept.
  await m.db
    .delete(m.schema.taskCompletions)
    .where(m.orm.eq(m.schema.taskCompletions.userId, userId));
  const blockD = await makePlan(4, 3);
  const moodD = taskOf(4, 4, "mood_log");
  await saveRow(blockD.id, moodD.id, { entries: [{ moods: ["keep-me"] }] });
  const copiedTo = await mirror(blockD, moodD);
  assert.ok(copiedTo.length >= 2, "the log should reach at least two other blocks");

  const { and, eq, inArray, sql } = m.orm;
  const t = m.schema.taskCompletions;
  const readRows = () =>
    m.db
      .select({ id: t.id, data: t.data })
      .from(t)
      .where(
        and(
          eq(t.userId, userId),
          inArray(t.planId, copiedTo),
          sql`${t.data}->'entries' = '[{"moods":["keep-me"]}]'::jsonb`,
        ),
      );
  const copyIds = (await readRows())
    .filter((row) => (row.data as Record<string, unknown>).syncedFromPlanId === blockD.id)
    .map((row) => row.id);
  assert.ok(copyIds.length >= 2, "at least two blocks should hold a copy of D");

  await m.shared.keepSharedLogsOfPlan({ planId: blockD.id, userIds: [userId], timezone: TZ });
  await m.db.delete(m.schema.plans).where(eq(m.schema.plans.id, blockD.id));

  const after = (await readRows()).filter((row) => copyIds.includes(row.id));
  const promoted = after.filter(
    (row) => (row.data as Record<string, unknown>).syncedFromPlanId === undefined,
  );
  assert.equal(after.length, copyIds.length);
  assert.equal(promoted.length, 1);
});

test("a copied log that finishes another block reports that block, not the block it was saved in", async () => {
  await m.db
    .delete(m.schema.taskCompletions)
    .where(m.orm.eq(m.schema.taskCompletions.userId, userId));
  // Started 2 days ago: today is Day 3. Every task is done except today's mood.
  const nearlyDone = await makePlan(5, 2);
  const lastMood = taskOf(5, 3, "mood_log");
  for (let day = 1; day <= 25; day++) {
    for (const task of m.program.getDayTasks(5, day)) {
      if (task.id !== lastMood.id) await saveRow(nearlyDone.id, task.id, {});
    }
  }
  const moodA = taskOf(1, 4, "mood_log");
  await saveRow(blockA.id, moodA.id, { entries: [{ moods: ["done"] }] });
  const result = await m.shared.mirrorSharedLog({
    userId,
    source: blockA,
    task: moodA,
    timezone: TZ,
  });
  assert.equal(result.finished?.blockNumber, 5);
  assert.equal(result.finished?.planId, nearlyDone.id);
});

test("a new block ignores an older day of another plan of the same block", async () => {
  await m.db
    .delete(m.schema.taskCompletions)
    .where(m.orm.eq(m.schema.taskCompletions.userId, userId));
  // Block B is on Day 2. A second plan of the same block is on Day 5, with a log on its old Day 2.
  const sameBlock = await makePlan(2, 4);
  await saveRow(sameBlock.id, taskOf(2, 2, "mood_log").id, { entries: [{ moods: ["old"] }] });
  const fresh = await makePlan(7, 0);
  await m.shared.copyTodaysLogsIntoPlan({ userId, plan: fresh, timezone: TZ });
  assert.equal(await readRow(fresh.id, taskOf(7, 1, "mood_log").id), null);
});

test("two saves of a plan's last task at once finish it once, without an error", async () => {
  const plan = await makePlan(4, 2);
  for (let day = 1; day <= 25; day++) {
    for (const task of m.program.getDayTasks(4, day)) await saveRow(plan.id, task.id, {});
  }
  const { finishPlanIfComplete } = await import("@/src/features/tasks/plan-finish");
  const results = await Promise.all([
    finishPlanIfComplete(userId, plan),
    finishPlanIfComplete(userId, plan),
  ]);
  assert.equal(results.filter((result) => result.blockCompleted).length, 1);
});
