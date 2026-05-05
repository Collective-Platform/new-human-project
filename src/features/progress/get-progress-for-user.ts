import { getCurrentDay } from "@/src/features/dashboard";
import { getPassageForLocale } from "@/src/features/bible";
import {
  getDayTasks,
  getUserCompletions,
  getDayCompletionStates,
  getFullyCompletedDays,
} from "./queries";

export interface ProgressTask {
  id: string;
  category: string;
  taskType: string;
  name: string;
  content: Record<string, unknown> | null;
  completed: boolean;
  completionData: Record<string, unknown> | null;
}

export interface ProgressCarouselDay {
  day: number;
  reachable: boolean;
  fullyCompleted: boolean;
}

export interface ProgressPayload {
  blockNumber: number;
  currentDay: number;
  selectedDay: number;
  blockStartDate: string;
  missedDays: number;
  carousel: ProgressCarouselDay[];
  tasks: ProgressTask[];
}

/**
 * Pure data-loading function for the member's progress view. Used by both
 * the GET /api/progress route handler and the (member)/progress Server
 * Component, so the page can server-render its initial paint without
 * making an HTTP round-trip to its own API.
 *
 * Mirrors the previous behavior of app/api/progress/route.ts exactly.
 */
export async function getProgressForUser(
  userId: number,
  onboardedAt: Date,
  requestedDayParam: number | null,
  locale: "en" | "zh",
): Promise<ProgressPayload> {
  const currentDay = getCurrentDay(onboardedAt);
  const requestedDay = Math.min(
    Math.max(requestedDayParam ?? currentDay, 1),
    25,
  );

  const blockNumber = 1;
  const tasks = await getDayTasks(blockNumber, requestedDay);
  const taskIds = tasks.map((t) => t.id);
  const completedMap = await getUserCompletions(userId, taskIds);

  const [dayStates, fullyCompletedDays] = await Promise.all([
    getDayCompletionStates(userId, blockNumber),
    getFullyCompletedDays(userId, blockNumber),
  ]);

  const carousel: ProgressCarouselDay[] = Array.from({ length: 25 }, (_, i) => {
    const day = i + 1;
    return {
      day,
      reachable: true,
      fullyCompleted: fullyCompletedDays.has(day),
    };
  });

  let missedDays = 0;
  for (let d = 1; d < currentDay; d++) {
    if (!dayStates.has(d)) missedDays++;
  }

  const enrichedTasks: ProgressTask[] = await Promise.all(
    tasks.map(async (t) => {
      let content = t.content as Record<string, unknown> | null;
      if (
        (t.taskType === "scripture_reading" ||
          t.taskType === "scripture_study") &&
        content &&
        typeof content.scripture_reference === "string"
      ) {
        const ref = content.scripture_reference as string;
        const passage = await getPassageForLocale(ref, locale);
        if (passage) {
          content = {
            ...content,
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

  return {
    blockNumber,
    currentDay,
    selectedDay: requestedDay,
    blockStartDate: onboardedAt.toISOString(),
    missedDays,
    carousel,
    tasks: enrichedTasks,
  };
}
