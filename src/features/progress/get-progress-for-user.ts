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
  taskIdsByDay: Record<number, string[]>;
  // Full completion map across ALL days, keyed by taskId. The client holds this
  // so day-switches resolve completion state locally without a server round-trip.
  completions: Record<string, Record<string, unknown> | null>;
}

export async function getProgressForUser(
  userId: number,
  onboardedAtMs: number,
  requestedDayParam: number | null,
  locale: "en" | "zh",
  currentDay: number,
  blockNumber: number,
): Promise<ProgressPayload> {
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
    taskIdsByDay: state.taskIdsByDay,
    completions: state.completions,
  };
}
