import { getSessionUser, isAdmin } from "@/src/features/auth";
import { getDailyReminderPreview } from "@/src/features/notifications/daily-reminder";

/**
 * GET /api/admin/notifications/daily-reminder
 *
 * Dry-run of the daily reminder cron: shows which users would receive a
 * notification right now and which would be skipped (and why), without
 * sending any push. Admin-only.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user || !isAdmin(user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const results = await getDailyReminderPreview();

  const summary = {
    total: results.length,
    willSend: results.filter((r) => r.willSend).length,
    skipped: {
      wrong_hour: results.filter((r) => r.skipReason === "wrong_hour").length,
      day_complete: results.filter((r) => r.skipReason === "day_complete").length,
      no_tasks_today: results.filter((r) => r.skipReason === "no_tasks_today").length,
    },
  };

  return Response.json({ summary, results });
}
