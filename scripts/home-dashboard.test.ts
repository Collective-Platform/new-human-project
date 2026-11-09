import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTestDatabaseEnvironment } from "./e2e-environment";

/**
 * Home reads all of a member's active blocks together. Runs against the local
 * `rhythm_test` database only (see tests/e2e/README.md). It creates one user with
 * two blocks and deletes them at the end.
 *
 *   pnpm exec tsx --test scripts/home-dashboard.test.ts
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
  home: typeof import("@/src/features/dashboard");
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
      inviteCode: `home-dash-${blockNumber}-${Date.now()}`,
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

async function save(
  plan: TestPlan,
  task: { id: string },
  data: Record<string, unknown>,
  daysAgo: number,
) {
  await m.db.insert(m.schema.taskCompletions).values({
    userId,
    planId: plan.id,
    taskId: task.id,
    data,
    completedAt: new Date(Date.now() - daysAgo * DAY),
  });
}

const plansArg = () =>
  [blockA, blockB].map((plan) => ({
    id: plan.id,
    blockNumber: plan.blockNumber,
    startMs: plan.startedAt.getTime(),
  }));

before(async () => {
  m = {
    db: (await import("@/src/db")).db,
    schema: await import("@/src/db/schema"),
    orm: await import("drizzle-orm"),
    shared: await import("@/src/features/tasks/shared-logs"),
    program: await import("@/src/features/content/program"),
    home: await import("@/src/features/dashboard"),
  };
  const [user] = await m.db
    .insert(m.schema.users)
    .values({ email: `home-dash-${Date.now()}@example.com` })
    .returning();
  userId = user.id;
  blockA = await makePlan(1, 3);
  blockB = await makePlan(2, 1);

  // Block A: mood three days ago (Day 1), exercise yesterday (Day 3, 60 minutes).
  await save(blockA, taskOf(1, 1, "mood_log"), { entries: [{ moods: ["good"] }] }, 2);
  await save(blockA, taskOf(1, 3, "exercise"), { entries: [{ sportKey: "run", hours: 1 }] }, 1);
  // Today, saved in block A and copied to block B the way the app does it.
  const moodToday = taskOf(1, 4, "mood_log");
  const exerciseToday = taskOf(1, 4, "exercise");
  await save(blockA, moodToday, { entries: [{ moods: ["peace"] }] }, 0);
  await save(
    blockA,
    exerciseToday,
    { entries: [{ sportKey: "others", customSport: "Crossfit", minutes: 30 }] },
    0,
  );
  for (const task of [moodToday, exerciseToday]) {
    await m.shared.mirrorSharedLog({ userId, source: blockA, task, timezone: TZ });
  }
});

after(async () => {
  const { inArray, eq } = m.orm;
  if (planIds.length) await m.db.delete(m.schema.plans).where(inArray(m.schema.plans.id, planIds));
  if (userId) await m.db.delete(m.schema.users).where(eq(m.schema.users.id, userId));
  // Close the pool so the test process can end; this keeps real failures visible.
  await (m.db as unknown as { $client?: { end(): Promise<void> } }).$client?.end();
});

test("a mood or exercise copied to another block is counted once in the charts", async () => {
  const home = await m.home.computeHomeDashboard(userId, plansArg(), TZ);
  assert.deepEqual(home.emotionBreakdown, { good: 1, peace: 1 });
  assert.equal(home.activityLast25.length, 25);
  assert.equal(home.activityLast25[24].totalMinutes, 30); // today, not 60
  assert.equal(home.activityLast25[23].totalMinutes, 60); // yesterday
});

test("a copied log still counts when the block that holds the original is no longer active", async () => {
  // Only block B is passed, as if block A had finished. B holds copies of today's logs.
  const onlyB = plansArg().filter((plan) => plan.id === blockB.id);
  const home = await m.home.computeHomeDashboard(userId, onlyB, TZ);
  assert.deepEqual(home.emotionBreakdown, { peace: 1 });
  assert.equal(home.activityLast25[24].totalMinutes, 30);
});

test("a copy already saved on an old block's Day 25 is not counted a second time", async () => {
  // Started 40 days ago, so its Day 25 is 16 days back. New logs no longer reach this
  // block, but a copy written before that rule can still be in the database.
  const stale = await makePlan(3, 40);
  const staleMood = taskOf(3, 25, "mood_log");
  await save(stale, staleMood, { entries: [{ moods: ["peace"] }], syncedFromPlanId: blockA.id }, 0);
  const plans = [
    ...plansArg(),
    { id: stale.id, blockNumber: stale.blockNumber, startMs: stale.startedAt.getTime() },
  ];
  const home = await m.home.computeHomeDashboard(userId, plans, TZ);
  assert.deepEqual(home.emotionBreakdown, { good: 1, peace: 1 });
  // The calendar starts on the 1st of this month. Before the 17th, the Day 25 date is in
  // last month and is cut by that filter, so the calendar check proves nothing then.
  // The emotion check above covers the skipped copy on every day of the month.
  const oldDate = new Date(Date.now() - 16 * DAY).toISOString().slice(0, 10);
  if (oldDate >= home.monthStartDate) {
    assert.equal(
      home.calendar.find((entry) => entry.date === oldDate),
      undefined,
    );
  }
});

test("an old block's own Day 25 log and today's log each count once", async () => {
  // A log saved today does not reach the old block, so its own Day 25 log stays as it was.
  const stale = await makePlan(4, 40);
  await save(stale, taskOf(4, 25, "mood_log"), { entries: [{ moods: ["day-25"] }] }, 16);
  await m.shared.mirrorSharedLog({
    userId,
    source: blockA,
    task: taskOf(1, 4, "mood_log"),
    timezone: TZ,
  });
  const plans = [
    ...plansArg(),
    { id: stale.id, blockNumber: stale.blockNumber, startMs: stale.startedAt.getTime() },
  ];
  const home = await m.home.computeHomeDashboard(userId, plans, TZ);
  assert.deepEqual(home.emotionBreakdown, { good: 1, peace: 1, "day-25": 1 });
});

test("the calendar shows each date once with its categories, from every block", async () => {
  const home = await m.home.computeHomeDashboard(userId, plansArg(), TZ);
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = home.calendar.find((entry) => entry.date === today);
  assert.deepEqual(todayEntry?.categories.sort(), ["Emotional", "Physical"]);
  assert.equal(new Set(home.calendar.map((entry) => entry.date)).size, home.calendar.length);
  assert.equal(home.monthStartDate, `${today.slice(0, 8)}01`);
  assert.ok(
    home.calendar.every((entry) => entry.date >= home.monthStartDate && entry.date <= today),
  );
});

test("the streak counts any day with any completion in any block", async () => {
  const home = await m.home.computeHomeDashboard(userId, plansArg(), TZ);
  assert.equal(home.streak, 3); // today, yesterday and two days ago
});

test("with no active blocks Home is empty and the triangle is flat", async () => {
  const home = await m.home.computeHomeDashboard(userId, [], TZ);
  assert.deepEqual(home.radar, { mental: 0, emotional: 0, physical: 0 });
  assert.deepEqual(home.emotionBreakdown, {});
  assert.deepEqual(home.calendar, []);
  assert.equal(home.earnedBadge, null);
});

test("the triangle averages blocks by days elapsed", async () => {
  const both = await m.home.computeHomeDashboard(userId, plansArg(), TZ);
  assert.ok(both.radar.physical > 0 && both.radar.physical <= 100);
  // Only block B has run 1 day and has a copied exercise, so alone it scores 100.
  const onlyB = await m.home.computeHomeDashboard(
    userId,
    [{ id: blockB.id, blockNumber: 2, startMs: blockB.startedAt.getTime() }],
    TZ,
  );
  assert.equal(onlyB.radar.physical, 100);
});

test("Home celebrates an unseen badge of a finished block, but not a legacy badge", async () => {
  const { eq } = m.orm;
  const { badgeDefinitions, memberBadges } = m.schema;
  const [badge] = await m.db
    .insert(badgeDefinitions)
    .values({ name: "Home test badge", blockNumber: 9_000 + (Date.now() % 900) })
    .returning();
  try {
    // A legacy badge has no plan. A member keeps it, but Home does not celebrate it.
    await m.db.insert(memberBadges).values({ userId, badgeId: badge.id, planId: null });
    const legacy = await m.home.computeHomeDashboard(userId, [], TZ);
    assert.equal(legacy.earnedBadge, null);

    // The finished block is not in the active list. This is the normal case.
    const [earned] = await m.db
      .insert(memberBadges)
      .values({ userId, badgeId: badge.id, planId: blockA.id })
      .returning();
    const onlyB = plansArg().filter((plan) => plan.id === blockB.id);
    const unseen = await m.home.computeHomeDashboard(userId, onlyB, TZ);
    assert.equal(unseen.earnedBadge?.memberBadgeId, earned.id);
    const noActive = await m.home.computeHomeDashboard(userId, [], TZ);
    assert.equal(noActive.earnedBadge?.memberBadgeId, earned.id);

    await m.db
      .update(memberBadges)
      .set({ seenAt: new Date() })
      .where(eq(memberBadges.id, earned.id));
    const seen = await m.home.computeHomeDashboard(userId, onlyB, TZ);
    assert.equal(seen.earnedBadge, null);
  } finally {
    await m.db.delete(memberBadges).where(eq(memberBadges.badgeId, badge.id));
    await m.db.delete(badgeDefinitions).where(eq(badgeDefinitions.id, badge.id));
  }
});
