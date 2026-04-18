import { getSessionUser } from "@/src/features/auth";
import {
  getCurrentDay,
  getRadarChartData,
  getBlockGrid,
  getStreak,
  getActivityCalendar,
  getRecentCompletions,
} from "@/src/features/dashboard";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.onboardedAt) {
    return Response.json({ error: "Not onboarded" }, { status: 403 });
  }

  const url = new URL(request.url);
  const days = url.searchParams.get("days") === "30" ? 30 : 7;

  const blockNumber = 1;
  const currentDay = getCurrentDay(user.onboardedAt);
  const daysElapsed = currentDay - 1;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 1);
  endDate.setHours(0, 0, 0, 0);

  const [radar, grid, streak, calendar, recent] = await Promise.all([
    getRadarChartData(user.id, blockNumber, daysElapsed),
    getBlockGrid(user.id, blockNumber, currentDay),
    getStreak(user.id),
    getActivityCalendar(user.id, startDate, endDate),
    getRecentCompletions(user.id, 10, startDate),
  ]);

  return Response.json({
    currentDay,
    radar,
    grid,
    streak,
    calendar,
    recent: recent.map((r) => ({
      category: r.category,
      name: r.name,
      completedAt: r.completedAt.toISOString(),
    })),
  });
}
