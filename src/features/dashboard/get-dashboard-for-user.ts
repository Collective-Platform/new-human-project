import { cacheLife, cacheTag } from "next/cache";
import { and, desc, eq, gte } from "drizzle-orm";
import { db, batchOrAll } from "@/src/db";
import { taskCompletions } from "@/src/db/schema";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";
import { getLocalizedString } from "@/src/features/content";
import { getNewlyEarnedBadge, hasCompletedBlock } from "@/src/features/badges";
import { getStreak, XP_WEIGHT_BY_TYPE } from "./queries";

export interface DashboardData {
  currentDay: number;
  radar: { mental: number; emotional: number; physical: number };
  grid: { day: number; categoriesCompleted: number }[];
  streak: number;
  calendar: { date: string; categories: string[] }[];
  recent: { category: string; name: string; completedAt: string }[];
  earnedBadge: {
    name: string;
    description: string | null;
    iconUrl: string | null;
    blockNumber: number;
    earnedAt: string;
  } | null;
  blockEndedWithoutCompletion: boolean;
}

export async function getDashboardForUser(
  userId: number,
  onboardedAtMs: number,
  daysWindow: number,
  locale: "en" | "zh",
  currentDay: number
): Promise<DashboardData> {
  'use cache';
  cacheLife('minutes');
  cacheTag(`dashboard:${userId}`);

  const onboardedAt = new Date(onboardedAtMs);
  const blockNumber = 1;
  const daysElapsed = currentDay - 1;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysWindow);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 1);
  endDate.setHours(0, 0, 0, 0);

  // Two lazy query builders for task_completions — sent as one HTTP round-trip
  // on Neon HTTP via batchOrAll; fall back to parallel execution locally.
  const allCompletionsQ = db
    .select({ taskId: taskCompletions.taskId })
    .from(taskCompletions)
    .where(eq(taskCompletions.userId, userId));

  const recentQ = db
    .select({
      taskId: taskCompletions.taskId,
      completedAt: taskCompletions.completedAt,
    })
    .from(taskCompletions)
    .where(
      and(
        eq(taskCompletions.userId, userId),
        gte(taskCompletions.completedAt, startDate)
      )
    )
    .orderBy(desc(taskCompletions.completedAt))
    .limit(10);

  // Batch the two completions queries while concurrently fetching streak + badges.
  const [[allCompletions, recentRows], streak, earnedBadge, blockDone] =
    await Promise.all([
      batchOrAll([allCompletionsQ, recentQ]),
      getStreak(userId),
      getNewlyEarnedBadge(userId, blockNumber),
      hasCompletedBlock(userId, blockNumber),
    ]);

  // Single pass over allCompletions builds radar, grid, and calendar together.
  // All task resolution is via the registry — block_day_tasks is legacy/empty.
  let mentalXp = 0;
  let emotionalCount = 0;
  let physicalCount = 0;
  const dayCategoryMap = new Map<number, Set<string>>();
  const dateCategories = new Map<string, Set<string>>();
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  for (const { taskId } of allCompletions) {
    const fromRegistry = getRegistryTaskById(taskId);
    if (!fromRegistry || fromRegistry.block !== blockNumber) continue;

    const { day: dayNumber, category, type: taskType } = fromRegistry;

    // Radar accumulation
    if (daysElapsed > 0) {
      if (category === "Mental") {
        mentalXp += XP_WEIGHT_BY_TYPE[taskType] ?? 1;
      } else if (category === "Emotional") {
        emotionalCount++;
      } else if (category === "Physical") {
        physicalCount++;
      }
    }

    // Block grid accumulation
    const cats = dayCategoryMap.get(dayNumber) ?? new Set<string>();
    cats.add(category);
    dayCategoryMap.set(dayNumber, cats);

    // Activity calendar accumulation
    const assigned = new Date(onboardedAt);
    assigned.setDate(assigned.getDate() + dayNumber - 1);
    assigned.setHours(0, 0, 0, 0);
    const ms = assigned.getTime();
    if (ms >= startMs && ms < endMs) {
      const dateStr = assigned.toISOString().slice(0, 10);
      const dc = dateCategories.get(dateStr) ?? new Set<string>();
      dc.add(category);
      dateCategories.set(dateStr, dc);
    }
  }

  const radar =
    daysElapsed <= 0
      ? { mental: 0, emotional: 0, physical: 0 }
      : {
          mental: Math.min((mentalXp / (daysElapsed * 3)) * 100, 100),
          emotional: Math.min((emotionalCount / daysElapsed) * 100, 100),
          physical: Math.min((physicalCount / daysElapsed) * 100, 100),
        };

  const grid = Array.from({ length: 25 }, (_, i) => {
    const day = i + 1;
    if (day > currentDay) return { day, categoriesCompleted: -1 };
    return { day, categoriesCompleted: dayCategoryMap.get(day)?.size ?? 0 };
  });

  const calendar = Array.from(dateCategories.entries())
    .map(([date, cats]) => ({ date, categories: Array.from(cats) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Process recent completions (date-filtered, ordered recentRows).
  const recent: { completedAt: string; category: string; name: string }[] = [];
  for (const row of recentRows) {
    const fromRegistry = getRegistryTaskById(row.taskId);
    if (!fromRegistry) continue;
    recent.push({
      completedAt: row.completedAt.toISOString(),
      category: fromRegistry.category,
      name: getLocalizedString(fromRegistry.name, locale),
    });
  }

  const blockEndedWithoutCompletion = currentDay >= 25 && !blockDone;

  return {
    currentDay,
    radar,
    grid,
    streak,
    calendar,
    recent,
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
  };
}

