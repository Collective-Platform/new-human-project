import { cookies } from "next/headers";
import { getSessionUser } from "@/src/features/auth";
import { getCurrentDay } from "@/src/features/dashboard";
import {
  getDayTasks,
  getUserCompletions,
  getDayCompletionStates,
  getFullyCompletedDays,
} from "@/src/features/progress";
import { getPassageForLocale } from "@/src/features/bible";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user?.onboardedAt) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const currentDay = getCurrentDay(user.onboardedAt);
  const requestedDay = Math.min(
    Math.max(Number(url.searchParams.get("day")) || currentDay, 1),
    25
  );

  const blockNumber = 1;
  const tasks = await getDayTasks(blockNumber, requestedDay);
  const taskIds = tasks.map((t) => t.id);
  const completedMap = await getUserCompletions(user.id, taskIds);

  // Get completion states for all days
  // - dayStates: any task completed on that day (used for missed days)
  // - fullyCompletedDays: all tasks for that day completed (used for carousel marker)
  const [dayStates, fullyCompletedDays] = await Promise.all([
    getDayCompletionStates(user.id, blockNumber),
    getFullyCompletedDays(user.id, blockNumber),
  ]);
  const carousel = Array.from({ length: 25 }, (_, i) => {
    const day = i + 1;
    return {
      day,
      reachable: true,
      fullyCompleted: fullyCompletedDays.has(day),
    };
  });

  // Count missed days: past days (before currentDay) with no completions
  let missedDays = 0;
  for (let d = 1; d < currentDay; d++) {
    if (!dayStates.has(d)) missedDays++;
  }

  // Resolve current locale (cookie set by the i18n switcher)
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value === "zh" ? "zh" : "en";

  // Prefetch Bible passage text for scripture tasks in the active locale only,
  // so the renderer can display verses instantly without a client roundtrip.
  const enrichedTasks = await Promise.all(
    tasks.map(async (t) => {
      let content = t.content;
      if (
        (t.taskType === "scripture_reading" ||
          t.taskType === "scripture_study") &&
        content &&
        typeof (content as Record<string, unknown>).scripture_reference ===
          "string"
      ) {
        const ref = (content as Record<string, unknown>)
          .scripture_reference as string;
        const passage = await getPassageForLocale(ref, locale);
        if (passage) {
          content = {
            ...(content as Record<string, unknown>),
            prefetched_passage: passage,
          };
        }
      }
      return {
        id: t.id,
        category: t.category,
        taskType: t.taskType,
        name: t.name,
        content,
        completed: completedMap.has(t.id),
        completionData: completedMap.get(t.id) ?? null,
      };
    }),
  );

  return Response.json({
    blockNumber,
    currentDay,
    selectedDay: requestedDay,
    blockStartDate: user.onboardedAt.toISOString(),
    missedDays,
    carousel,
    tasks: enrichedTasks,
  });
}
