import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTestDatabaseEnvironment } from "./e2e-environment";

/**
 * The daily reminder looks at every active block of a member, not at one chosen
 * block. Runs against the local `rhythm_test` database only (see tests/e2e/README.md).
 * It uses the preview function, so it never sends a push. It creates one user with
 * two blocks and deletes them at the end.
 *
 *   pnpm exec tsx --test scripts/daily-reminder.test.ts
 */
const settings = loadTestDatabaseEnvironment();
process.env.DATABASE_URL = settings.DATABASE_URL;
process.env.DATABASE_PROVIDER = "local";
process.env.SESSION_SECRET = settings.SESSION_SECRET || "test-only";

const DAY = 86_400_000;

type Modules = {
  db: typeof import("@/src/db").db;
  schema: typeof import("@/src/db/schema");
  orm: typeof import("drizzle-orm");
  reminder: typeof import("@/src/features/notifications/daily-reminder");
  program: typeof import("@/src/features/content/program");
};
let m: Modules;
let userId: number;
const planIds: string[] = [];

type TestPlan = { id: string; blockNumber: number };
let blockA: TestPlan; // started 3 days ago: today is Day 4
let blockB: TestPlan; // started 1 day ago: today is Day 2

function utcHour(offset = 0) {
  const hour = (new Date().getUTCHours() + offset + 24) % 24;
  return `${String(hour).padStart(2, "0")}:00`;
}

async function setReminderTime(time: string) {
  await m.db
    .update(m.schema.users)
    .set({
      notificationPrefs: {
        daily_reminder: true,
        reminder_time: time,
        reminder_timezone: "UTC",
        friend_requests: true,
      } as typeof m.schema.users.$inferInsert.notificationPrefs,
    })
    .where(m.orm.eq(m.schema.users.id, userId));
}

async function makePlan(blockNumber: number, startedDaysAgo: number): Promise<TestPlan> {
  const [plan] = await m.db
    .insert(m.schema.plans)
    .values({
      blockNumber,
      createdBy: userId,
      inviteCode: `daily-reminder-${blockNumber}-${Date.now()}`,
      startedAt: new Date(Date.now() - startedDaysAgo * DAY),
    })
    .returning();
  planIds.push(plan.id);
  await m.db.insert(m.schema.planMembers).values({ planId: plan.id, userId, role: "owner" });
  return { id: plan.id, blockNumber };
}

async function preview() {
  const rows = await m.reminder.getDailyReminderPreview();
  return rows.find((row) => row.userId === userId);
}

async function completeToday(plan: TestPlan, day: number) {
  const tasks = m.program.getDayTasks(plan.blockNumber, day);
  assert.ok(tasks.length > 0, `block ${plan.blockNumber} day ${day} has no tasks`);
  await m.db
    .insert(m.schema.taskCompletions)
    .values(tasks.map((task) => ({ userId, planId: plan.id, taskId: task.id, data: {} })));
}

async function finishBlock(plan: TestPlan) {
  await m.db.insert(m.schema.planCompletions).values({ planId: plan.id, userId });
}

before(async () => {
  m = {
    db: (await import("@/src/db")).db,
    schema: await import("@/src/db/schema"),
    orm: await import("drizzle-orm"),
    reminder: await import("@/src/features/notifications/daily-reminder"),
    program: await import("@/src/features/content/program"),
  };
  const [user] = await m.db
    .insert(m.schema.users)
    .values({ email: `daily-reminder-${Date.now()}@example.com` })
    .returning();
  userId = user.id;
  await m.db.insert(m.schema.pushSubscriptions).values({
    userId,
    endpoint: `https://example.com/daily-reminder-${Date.now()}`,
    subscription: {},
  });
  await setReminderTime(utcHour());
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

test("a member with two active blocks and nothing done gets a reminder", async () => {
  const result = await preview();
  assert.equal(result?.willSend, true);
  // The reminder opens the newest block with tasks left.
  assert.equal(result?.currentDay, 2);
});

test("a reminder still comes when only one of the two blocks has tasks left", async () => {
  await completeToday(blockB, 2);
  const result = await preview();
  assert.equal(result?.willSend, true);
  assert.equal(result?.currentDay, 4); // block A, which still has tasks left
});

test("no reminder when today's tasks are done in every active block", async () => {
  await completeToday(blockA, 4);
  const result = await preview();
  assert.equal(result?.willSend, false);
  assert.equal(result?.skipReason, "day_complete");
});

test("a block past its 25 days does not trigger a reminder", async () => {
  // Today's tasks are done in both running blocks. Only the old block has tasks left.
  const stale = await makePlan(3, 40);
  const result = await preview();
  assert.equal(result?.willSend, false);
  assert.equal(result?.skipReason, "day_complete");
  await finishBlock(stale);
});

test("finishing one block does not stop reminders for the other", async () => {
  await m.db
    .delete(m.schema.taskCompletions)
    .where(m.orm.eq(m.schema.taskCompletions.userId, userId));
  await finishBlock(blockA);
  const result = await preview();
  assert.equal(result?.willSend, true);
  assert.equal(result?.currentDay, 2);
});

test("a different reminder hour gives no reminder", async () => {
  await setReminderTime(utcHour(12));
  const result = await preview();
  assert.equal(result?.willSend, false);
  assert.equal(result?.skipReason, "wrong_hour");
  await setReminderTime(utcHour());
});

test("a member who finished every block is not in the reminder list", async () => {
  await finishBlock(blockB);
  assert.equal(await preview(), undefined);
});
