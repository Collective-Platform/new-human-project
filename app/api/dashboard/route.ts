import { getSessionUser } from "@/src/features/auth";
import {
  getCurrentDay,
  getRadarChartData,
  getBlockGrid,
  getStreak,
  getActivityCalendar,
  getRecentCompletions,
} from "@/src/features/dashboard";
import { getNewlyEarnedBadge, hasCompletedBlock } from "@/src/features/badges";

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

  const [radar, grid, streak, calendar, recent, earnedBadge, blockDone] =
    await Promise.all([
      getRadarChartData(user.id, blockNumber, daysElapsed),
      getBlockGrid(user.id, blockNumber, currentDay),
      getStreak(user.id),
      getActivityCalendar(user.id, startDate, endDate),
      getRecentCompletions(user.id, 10, startDate),
      getNewlyEarnedBadge(user.id, blockNumber),
      hasCompletedBlock(user.id, blockNumber),
    ]);

  // Block ended without completion: day 25 reached but block not done
  const blockEndedWithoutCompletion = currentDay >= 25 && !blockDone;

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
    earnedBadge: earnedBadge
      ? {
          name: earnedBadge.name,
          description: earnedBadge.description,
          iconUrl: earnedBadge.iconUrl,
          blockNumber: earnedBadge.blockNumber,
          earnedAt: earnedBadge.earnedAt.toISOString(),
        }
      : null,
    blockEndedWithoutCompletion,
  });
}
