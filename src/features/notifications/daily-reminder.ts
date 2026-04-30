import { db } from "@/src/db";
import { sql } from "drizzle-orm";
import { sendPushToUser } from "./push";

// Localised messages
const messages: Record<string, { title: string; body: string }> = {
  en: {
    title: "The New Human Project",
    body: "Time for your daily formation! 🌱",
  },
  zh: {
    title: "新人类计划",
    body: "是时候进行每日灵修了！🌱",
  },
};

/**
 * Send daily reminders to users whose configured reminder_time matches
 * the current hour. Call this function from a cron job every hour.
 *
 * @param currentHour - The current hour in HH:00 format (e.g., "08:00")
 */
export async function sendDailyReminders(currentHour: string) {
  // Query users with daily_reminder enabled and matching reminder_time
  // who have a push subscription
  const result = await db.execute(sql`
    SELECT u.id, u.notification_prefs
    FROM users u
    JOIN push_subscriptions ps ON ps.user_id = u.id
    WHERE u.onboarded_at IS NOT NULL
      AND (u.notification_prefs->>'daily_reminder')::boolean = true
      AND COALESCE(u.notification_prefs->>'reminder_time', '08:00') = ${currentHour}
  `);

  for (const row of result.rows as { id: number }[]) {
    // Default to English; in a full implementation we'd read the user's locale
    const msg = messages.en;
    try {
      await sendPushToUser(
        Number(row.id),
        { title: msg.title, body: msg.body, url: "/" },
        "daily_reminder"
      );
    } catch {
      // Continue sending to other users
    }
  }

  return result.rows.length;
}
