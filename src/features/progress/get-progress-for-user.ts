import { cacheTag, cacheLife } from "next/cache";
import { getDayContent } from "./get-day-content";
import { getUserProgressState } from "./get-user-progress-state";

export interface ProgressTask {
  id: string;
  category: string;
  taskType: string;
  name: string;
  content: Record<string, unknown> | null;
  completed: boolean;
  completionData: Record<string, unknown> | null;
  body?: string;
  passageRef?: string;
  scriptureRef?: string;
  inputs?: string[];
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

export async function getProgressForUser(
  userId: number,
  onboardedAtMs: number,
  requestedDayParam: number | null,
  locale: "en" | "zh",
  currentDay: number,
): Promise<ProgressPayload> {
  "use cache";
  cacheTag(`progress:${userId}`);
  cacheLife("minutes");
  const blockNumber = 1;
  const selectedDay = Math.min(Math.max(requestedDayParam ?? currentDay, 1), 25);

  const [content, state] = await Promise.all([
    getDayContent(blockNumber, selectedDay, locale),
    getUserProgressState(userId, blockNumber, currentDay),
  ]);

  const tasks: ProgressTask[] = content.tasks.map((t) => ({
    ...t,
    completed: t.id in state.completions,
    completionData: state.completions[t.id] ?? null,
  }));

  return {
    blockNumber,
    currentDay,
    selectedDay,
    blockStartDate: new Date(onboardedAtMs).toISOString(),
    missedDays: state.missedDays,
    carousel: state.carousel,
    tasks,
  };
}
