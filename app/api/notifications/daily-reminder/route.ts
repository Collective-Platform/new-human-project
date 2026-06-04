import { sendDailyReminders } from "@/src/features/notifications";

/**
 * Cron endpoint: GET /api/notifications/daily-reminder
 *
 * Triggered by Vercel Cron (see vercel.json) every hour. Vercel Cron always
 * issues GET requests and automatically injects `Authorization: Bearer
 * ${CRON_SECRET}` when that env var is set. Sends push notifications to users
 * whose configured reminder_time matches the current hour.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret === undefined || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await sendDailyReminders();

  return Response.json({ success: true, sent: count });
}
