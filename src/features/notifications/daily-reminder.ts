import { db } from "@/src/db";
import { sql } from "drizzle-orm";
import { sendPushToUser } from "./push";

const messages: Record<string, { title: string; body: string }> = {
  en: {
    title: "Rhythm",
    body: "Time for your daily formation! 🌱",
  },
  zh: {
    title: "节奏",
    body: "是时候进行每日灵修了！🌱",
  },
};

function localHourForUser(now: Date, timezone: string): string {
  try {
    // Returns the current hour (0–23) in the user's timezone as "HH:00"
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

/**
 * Send daily reminders to users whose reminder_time matches the current hour
 * in their own timezone. Called from a cron job every hour.
 */
export async function sendDailyReminders() {
  const now = new Date();

  // Fetch all users with daily_reminder enabled who have a push subscription.
  // Hour matching is done in JS so each user's timezone is respected.
  const result = await db.execute(sql`
    SELECT DISTINCT u.id, u.notification_prefs
    FROM nhp.users u
    JOIN nhp.push_subscriptions ps ON ps.user_id = u.id
    WHERE u.onboarded_at IS NOT NULL
      AND (u.notification_prefs->>'daily_reminder')::boolean = true
  `);

  let sent = 0;
  for (const row of result.rows as {
    id: number;
    notification_prefs: Record<string, string>;
  }[]) {
    const prefs = row.notification_prefs ?? {};
    const reminderTime = prefs.reminder_time ?? "08:00";
    const timezone = prefs.reminder_timezone ?? "UTC";

    // Strip minutes — cron has hour granularity, compare "HH:00" vs "HH:00"
    const reminderHour = `${reminderTime.slice(0, 2)}:00`;
    if (localHourForUser(now, timezone) !== reminderHour) continue;

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
