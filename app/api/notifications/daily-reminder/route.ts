import { sendDailyReminders } from "@/src/features/notifications";

/**
 * Cron endpoint: POST /api/notifications/daily-reminder
 *
 * Call this from an external cron service (e.g., Vercel Cron, Railway cron)
 * every hour. It sends push notifications to users whose configured
 * reminder_time matches the current hour.
 *
 * Protected by a simple bearer token check (CRON_SECRET env var).
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const currentHour = `${String(now.getUTCHours()).padStart(2, "0")}:00`;

  const count = await sendDailyReminders(currentHour);

  return Response.json({ success: true, sent: count, hour: currentHour });
}
