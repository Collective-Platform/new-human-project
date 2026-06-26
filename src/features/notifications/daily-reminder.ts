import { db } from "@/src/db";
import { taskCompletions } from "@/src/db/schema";
import { sql, inArray } from "drizzle-orm";
import { getDayTasks as getRegistryDayTasks } from "@/src/features/content/program";
import { getCurrentDay } from "@/src/features/dashboard";
import { PROGRAM_BLOCK_START } from "@/src/lib/program-gate";
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

/**
 * Evaluate reminder eligibility for all subscribed users without sending
 * any push notifications. Used by the admin preview endpoint.
 */
export async function getDailyReminderPreview(): Promise<ReminderEligibilityResult[]> {
  const now = new Date();

  const result = await db.execute(sql`
    SELECT DISTINCT u.id, u.notification_prefs, u.onboarded_at
    FROM nhp.users u
    JOIN nhp.push_subscriptions ps ON ps.user_id = u.id
    WHERE u.onboarded_at IS NOT NULL
      AND (u.notification_prefs->>'daily_reminder')::boolean = true
  `);

  const allRows = result.rows as {
    id: number;
    notification_prefs: Record<string, string>;
    onboarded_at: string;
  }[];

  const userIds = allRows.map((r) => Number(r.id));
  const completionRows =
    userIds.length > 0
      ? await db
          .select({ userId: taskCompletions.userId, taskId: taskCompletions.taskId })
          .from(taskCompletions)
          .where(inArray(taskCompletions.userId, userIds))
      : [];

  const completionsByUser = new Map<number, Set<string>>();
  for (const c of completionRows) {
    if (!completionsByUser.has(c.userId)) completionsByUser.set(c.userId, new Set());
    completionsByUser.get(c.userId)!.add(c.taskId);
  }

  return allRows.map((row) => {
    const prefs = row.notification_prefs ?? {};
    const reminderTime = prefs.reminder_time ?? "08:00";
    const timezone = prefs.reminder_timezone ?? "UTC";
    const reminderHour = `${reminderTime.slice(0, 2)}:00`;

    if (localHourForUser(now, timezone) !== reminderHour) {
      // Compute currentDay anyway so the preview shows it regardless.
      const onboardedAt = new Date(row.onboarded_at);
      const effectiveStart =
        onboardedAt.getTime() < PROGRAM_BLOCK_START.getTime()
          ? PROGRAM_BLOCK_START
          : onboardedAt;
      return {
        userId: Number(row.id),
        currentDay: getCurrentDay(effectiveStart),
        willSend: false,
        skipReason: "wrong_hour" as ReminderSkipReason,
      };
    }

    const onboardedAt = new Date(row.onboarded_at);
    const effectiveStart =
      onboardedAt.getTime() < PROGRAM_BLOCK_START.getTime()
        ? PROGRAM_BLOCK_START
        : onboardedAt;
    const currentDay = getCurrentDay(effectiveStart);
    const todayTasks = getRegistryDayTasks(1, currentDay);

    if (todayTasks.length === 0) {
      return { userId: Number(row.id), currentDay, willSend: false, skipReason: "no_tasks_today" as ReminderSkipReason };
    }

    const completedIds = completionsByUser.get(Number(row.id)) ?? new Set<string>();
    if (todayTasks.every((t) => completedIds.has(t.id))) {
      return { userId: Number(row.id), currentDay, willSend: false, skipReason: "day_complete" as ReminderSkipReason };
    }

    return { userId: Number(row.id), currentDay, willSend: true };
  });
}

/**
 * Send daily reminders to users whose reminder_time matches the current hour
 * in their own timezone. Skips users who have already completed all tasks for
 * today, and users who have finished the entire block with no new content yet.
 * Called from a cron job every hour.
 */
export async function sendDailyReminders() {
  const now = new Date();

  const result = await db.execute(sql`
    SELECT DISTINCT u.id, u.notification_prefs, u.onboarded_at
    FROM nhp.users u
    JOIN nhp.push_subscriptions ps ON ps.user_id = u.id
    WHERE u.onboarded_at IS NOT NULL
      AND (u.notification_prefs->>'daily_reminder')::boolean = true
  `);

  const allRows = result.rows as {
    id: number;
    notification_prefs: Record<string, string>;
    onboarded_at: string;
  }[];

  // Filter to users whose reminder hour matches the current hour.
  const eligibleRows = allRows.filter((row) => {
    const prefs = row.notification_prefs ?? {};
    const reminderTime = prefs.reminder_time ?? "08:00";
    const timezone = prefs.reminder_timezone ?? "UTC";
    const reminderHour = `${reminderTime.slice(0, 2)}:00`;
    return localHourForUser(now, timezone) === reminderHour;
  });

  if (eligibleRows.length === 0) return 0;

  // Batch-fetch completions for all eligible users in one query.
  const userIds = eligibleRows.map((r) => Number(r.id));
  const completionRows = await db
    .select({ userId: taskCompletions.userId, taskId: taskCompletions.taskId })
    .from(taskCompletions)
    .where(inArray(taskCompletions.userId, userIds));

  const completionsByUser = new Map<number, Set<string>>();
  for (const c of completionRows) {
    if (!completionsByUser.has(c.userId)) completionsByUser.set(c.userId, new Set());
    completionsByUser.get(c.userId)!.add(c.taskId);
  }

  let sent = 0;
  for (const row of eligibleRows) {
    const onboardedAt = new Date(row.onboarded_at);
    const effectiveStart =
      onboardedAt.getTime() < PROGRAM_BLOCK_START.getTime()
        ? PROGRAM_BLOCK_START
        : onboardedAt;
    const currentDay = getCurrentDay(effectiveStart);

    const todayTasks = getRegistryDayTasks(1, currentDay);

    // No tasks authored for today — block is complete or content not yet released.
    if (todayTasks.length === 0) continue;

    // All of today's tasks already done — nothing left to remind about.
    const completedIds = completionsByUser.get(Number(row.id)) ?? new Set<string>();
    if (todayTasks.every((t) => completedIds.has(t.id))) continue;

    const msg = messages.en;
    try {
      await sendPushToUser(
        Number(row.id),
        { title: msg.title, body: msg.body, url: "/" },
        "daily_reminder",
      );
      sent++;
    } catch {
      // Continue to next user
    }
  }

  return sent;
}
