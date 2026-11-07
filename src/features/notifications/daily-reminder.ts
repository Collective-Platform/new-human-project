import { db } from "@/src/db";
import { taskCompletions } from "@/src/db/schema";
import { sql, inArray } from "drizzle-orm";
import { getDayTasks as getRegistryDayTasks } from "@/src/features/content/program";
import { getPlanCurrentDay, isPlanPastLastDay } from "@/src/features/plans/queries";
import { sendPushToUser } from "./push";

const messages: Record<string, { title: string; body: string }> = {
  en: {
    title: "Rhythm",
    body: "Time to get on your daily rhythm! ",
  },
  zh: {
    title: "节奏",
    body: "是时候进行每日灵修了！",
  },
};

function localHourForUser(now: Date, timezone: string): string {
  try {
    const hour = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      hour: "2-digit",
      hour12: false,
    }).format(now);
    // Intl may return "24" for midnight in some environments — normalise to "00"
    return `${hour === "24" ? "00" : hour}:00`;
  } catch {
    // Unknown timezone — fall back to UTC
    return `${String(now.getUTCHours()).padStart(2, "0")}:00`;
  }
}

export type ReminderSkipReason = "wrong_hour" | "no_tasks_today" | "day_complete";

export interface ReminderEligibilityResult {
  userId: number;
  currentDay: number;
  willSend: boolean;
  skipReason?: ReminderSkipReason;
}

interface ReminderPlanRow {
  id: number;
  notification_prefs: Record<string, string> | null;
  plan_id: string;
  block_number: number;
  started_at: string;
}

interface ReminderDecision extends ReminderEligibilityResult {
  /** The plan the reminder opens. Set only when willSend is true. */
  planId?: string;
}

/**
 * One row per subscribed user and active, unfinished plan. The reminder looks
 * at every active block together, like Home does.
 */
async function getReminderPlanRows(): Promise<ReminderPlanRow[]> {
  const result = await db.execute(sql`
    SELECT DISTINCT u.id, u.notification_prefs, p.id AS plan_id, p.block_number, p.started_at
    FROM nhp.users u
    JOIN nhp.push_subscriptions ps ON ps.user_id = u.id
    JOIN nhp.plan_members pm ON pm.user_id = u.id AND pm.status = 'active'
    JOIN nhp.plans p ON p.id = pm.plan_id
    WHERE (u.notification_prefs->>'daily_reminder')::boolean = true
      AND NOT EXISTS (
        SELECT 1 FROM nhp.plan_completions pc
        WHERE pc.plan_id = p.id AND pc.user_id = u.id
      )
    ORDER BY u.id, p.started_at DESC
  `);
  return result.rows as unknown as ReminderPlanRow[];
}

async function getCompletionsByPlanMember(userIds: number[]) {
  const completionsByPlanMember = new Map<string, Set<string>>();
  if (userIds.length === 0) return completionsByPlanMember;
  const completionRows = await db
    .select({
      userId: taskCompletions.userId,
      planId: taskCompletions.planId,
      taskId: taskCompletions.taskId,
    })
    .from(taskCompletions)
    .where(inArray(taskCompletions.userId, userIds));
  for (const c of completionRows) {
    if (!c.planId) continue;
    const key = `${c.userId}:${c.planId}`;
    const ids = completionsByPlanMember.get(key) ?? new Set<string>();
    ids.add(c.taskId);
    completionsByPlanMember.set(key, ids);
  }
  return completionsByPlanMember;
}

/**
 * Decide, for each user, whether to send one reminder. A user gets a reminder
 * when any active block still has tasks left for today. A block past its 25 days
 * does not count: it has no "today" left. Rows must be sorted so
 * the newest plan of each user comes first.
 */
async function decideReminders(rows: ReminderPlanRow[], now: Date): Promise<ReminderDecision[]> {
  const rowsByUser = new Map<number, ReminderPlanRow[]>();
  for (const row of rows) {
    const list = rowsByUser.get(Number(row.id)) ?? [];
    list.push(row);
    rowsByUser.set(Number(row.id), list);
  }

  // Only load completions for users whose reminder hour is now.
  const dueUserIds = [...rowsByUser.entries()]
    .filter(([, list]) => isReminderHour(list[0], now))
    .map(([userId]) => userId);
  const completionsByPlanMember = await getCompletionsByPlanMember(dueUserIds);

  const decisions: ReminderDecision[] = [];
  for (const [userId, list] of rowsByUser) {
    const timezone = list[0].notification_prefs?.reminder_timezone ?? "UTC";
    const newestDay = getPlanCurrentDay(new Date(list[0].started_at), timezone, now);

    if (!isReminderHour(list[0], now)) {
      // Report currentDay anyway so the preview shows it regardless.
      decisions.push({
        userId,
        currentDay: newestDay,
        willSend: false,
        skipReason: "wrong_hour",
      });
      continue;
    }

    let sawTasks = false;
    let pending: { planId: string; day: number } | null = null;
    for (const row of list) {
      if (isPlanPastLastDay(new Date(row.started_at), timezone, now)) continue;
      const day = getPlanCurrentDay(new Date(row.started_at), timezone, now);
      const todayTasks = getRegistryDayTasks(Number(row.block_number), day);
      // No tasks authored for today — block is complete or content not yet released.
      if (todayTasks.length === 0) continue;
      sawTasks = true;
      const completedIds = completionsByPlanMember.get(`${userId}:${row.plan_id}`) ?? new Set();
      if (todayTasks.every((t) => completedIds.has(t.id))) continue;
      pending = { planId: row.plan_id, day };
      break;
    }

    if (pending) {
      decisions.push({ userId, currentDay: pending.day, willSend: true, planId: pending.planId });
    } else {
      decisions.push({
        userId,
        currentDay: newestDay,
        willSend: false,
        skipReason: sawTasks ? "day_complete" : "no_tasks_today",
      });
    }
  }
  return decisions;
}

function isReminderHour(row: ReminderPlanRow, now: Date): boolean {
  const prefs = row.notification_prefs ?? {};
  const reminderTime = prefs.reminder_time ?? "08:00";
  const timezone = prefs.reminder_timezone ?? "UTC";
  const reminderHour = `${reminderTime.slice(0, 2)}:00`;
  return localHourForUser(now, timezone) === reminderHour;
}

/**
 * Evaluate reminder eligibility for all subscribed users without sending
 * any push notifications. Used by the admin preview endpoint.
 */
export async function getDailyReminderPreview(): Promise<ReminderEligibilityResult[]> {
  const decisions = await decideReminders(await getReminderPlanRows(), new Date());
  return decisions.map(({ planId: _planId, ...result }) => result);
}

/**
 * Send daily reminders to users whose reminder_time matches the current hour
 * in their own timezone. A user gets one reminder when any active block still
 * has tasks left for today. Called from a cron job every hour.
 */
export async function sendDailyReminders() {
  const decisions = await decideReminders(await getReminderPlanRows(), new Date());

  let sent = 0;
  for (const decision of decisions) {
    if (!decision.willSend || !decision.planId) continue;
    const msg = messages.en;
    try {
      await sendPushToUser(
        decision.userId,
        { title: msg.title, body: msg.body, url: `/progress/${decision.planId}` },
        "daily_reminder",
      );
      sent++;
    } catch {
      // Continue to next user
    }
  }

  return sent;
}
