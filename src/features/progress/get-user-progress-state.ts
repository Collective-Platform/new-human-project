import { db } from "@/src/db";
import { taskCompletions } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import {
  getDayTasks as getRegistryDayTasks,
  getTaskById as getRegistryTaskById,
} from "@/src/features/content/program";
import type { ProgressCarouselDay } from "./get-progress-for-user";

export interface UserProgressState {
  completions: Record<string, Record<string, unknown> | null>;
  carousel: ProgressCarouselDay[];
  missedDays: number;
  taskIdsByDay: Record<number, string[]>;
}

// Not cached — one fast indexed DB query, always returns the freshest completion
// state. Caching this was the root cause of the post-completion checkbox flicker:
// the SSR HTML would show stale (unchecked) state, and the client localStorage
// overlay can only fix it after hydration, producing a visible flash.
export async function getUserProgressState(
  userId: number,
  blockNumber: number,
  currentDay: number,
): Promise<UserProgressState> {
  // Single DB round-trip for all three derived values.
  const rows = await db
    .select({ taskId: taskCompletions.taskId, data: taskCompletions.data })
    .from(taskCompletions)
    .where(eq(taskCompletions.userId, userId));

  const completions: Record<string, Record<string, unknown> | null> = {};
  const completedIds = new Set<string>();
  for (const row of rows) {
    completions[row.taskId] = row.data as Record<string, unknown> | null;
    completedIds.add(row.taskId);
  }

  // Which days have at least one completion (for missedDays).
  const dayHasCompletion = new Set<number>();
  for (const taskId of completedIds) {
    const t = getRegistryTaskById(taskId);
    if (t && t.block === blockNumber) dayHasCompletion.add(t.day);
  }

  // Which days have every task completed (for carousel fullyCompleted).
  const taskIdsByDay: Record<number, string[]> = {};
  const fullyCompletedDays = new Set<number>();
  for (let day = 1; day <= 25; day++) {
    const tasks = getRegistryDayTasks(blockNumber, day);
    if (tasks.length === 0) continue;
    taskIdsByDay[day] = tasks.map((t) => t.id);
    if (tasks.every((t) => completedIds.has(t.id))) fullyCompletedDays.add(day);
  }

  const carousel: ProgressCarouselDay[] = Array.from({ length: 25 }, (_, i) => {
    const day = i + 1;
    return { day, reachable: true, fullyCompleted: fullyCompletedDays.has(day) };
  });

  let missedDays = 0;
  for (let d = 1; d < currentDay; d++) {
    if (!dayHasCompletion.has(d)) missedDays++;
  }

  return { completions, carousel, missedDays, taskIdsByDay };
}
