import { cacheLife, cacheTag } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db, batchOrAll } from "@/src/db";
import {
  taskCompletions,
  memberBadges,
  badgeDefinitions,
  memberBlockCompletions,
} from "@/src/db/schema";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";
import { XP_WEIGHT_BY_TYPE } from "./queries";

export interface DashboardData {
  currentDay: number;
  radar: { mental: number; emotional: number; physical: number };
  grid: { day: number; categoriesCompleted: number }[];
  streak: number;
  calendar: { date: string; categories: string[] }[];
  earnedBadge: {
    name: string;
    description: string | null;
    iconUrl: string | null;
    blockNumber: number;
    earnedAt: string;
  } | null;
  blockEndedWithoutCompletion: boolean;
  emotionBreakdown: Record<string, number>;
  blockStartDate: string;
}

export async function getDashboardForUser(
  userId: number,
  onboardedAtMs: number,
  daysWindow: number,
  locale: "en" | "zh",
  currentDay: number,
): Promise<DashboardData> {
  "use cache";
  cacheLife("minutes");
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

  // Five lazy query builders sent as ONE HTTP round-trip on the Neon-protocol
  // batch endpoint (PlanetScale Postgres in prod). Local node-postgres falls
  // back to Promise.all in batchOrAll().
  const allCompletionsQ = db
    .select({ taskId: taskCompletions.taskId, data: taskCompletions.data })
    .from(taskCompletions)
    .where(eq(taskCompletions.userId, userId));

  const streakQ = db.execute<{ streak: number }>(sql`
    WITH completion_dates AS (
      SELECT DISTINCT tc.completed_at::date AS d
      FROM nhp.task_completions tc
      WHERE tc.user_id = ${userId}
        AND tc.completed_at::date <= CURRENT_DATE
    ),
    numbered AS (
      SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d ASC))::int AS grp
      FROM completion_dates
    )
    SELECT COUNT(*)::int AS streak
    FROM numbered
    WHERE grp = (
      SELECT grp FROM numbered
      WHERE d >= CURRENT_DATE - 1
      ORDER BY d DESC
      LIMIT 1
    )
  `);

  const badgeQ = db
    .select({
      badgeId: memberBadges.badgeId,
      earnedAt: memberBadges.earnedAt,
      name: badgeDefinitions.name,
      description: badgeDefinitions.description,
      iconUrl: badgeDefinitions.iconUrl,
      blockNumber: badgeDefinitions.blockNumber,
    })
    .from(memberBadges)
    .innerJoin(badgeDefinitions, eq(memberBadges.badgeId, badgeDefinitions.id))
    .where(
      and(
        eq(memberBadges.userId, userId),
        eq(badgeDefinitions.blockNumber, blockNumber),
      ),
    )
    .limit(1);

  const blockDoneQ = db
    .select({ id: memberBlockCompletions.id })
    .from(memberBlockCompletions)
    .where(
      and(
        eq(memberBlockCompletions.userId, userId),
        eq(memberBlockCompletions.blockNumber, blockNumber),
      ),
    )
    .limit(1);

  const [allCompletions, streakResult, badgeRows, blockDoneRows] =
    await batchOrAll([allCompletionsQ, streakQ, badgeQ, blockDoneQ]);

  const streakRow = (streakResult as unknown as { rows: { streak: number }[] })
    .rows[0];
  const streak = streakRow ? Number(streakRow.streak) : 0;
  const earnedBadge = badgeRows[0] ?? null;
  const blockDone = blockDoneRows.length > 0;

  // Single pass over allCompletions builds radar, grid, and calendar together.
  // All task resolution is via the registry — block_day_tasks is legacy/empty.
  let mentalXp = 0;
  let emotionalCount = 0;
  let physicalCount = 0;
  const dayCategoryMap = new Map<number, Set<string>>();
  const dateCategories = new Map<string, Set<string>>();
  const emotionBreakdown: Record<string, number> = {};
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  for (const { taskId, data } of allCompletions) {
    const fromRegistry = getRegistryTaskById(taskId);
    if (!fromRegistry || fromRegistry.block !== blockNumber) continue;

    const { day: dayNumber, category, type: taskType } = fromRegistry;

    if (taskType === "mood_log" && data) {
      const d = data as Record<string, unknown>;
      const moodEntries: { moods?: string[] }[] = Array.isArray(d.entries)
        ? (d.entries as { moods?: string[] }[])
        : Array.isArray(d.moods)
          ? [{ moods: d.moods as string[] }]
          : d.mood
            ? [{ moods: [d.mood as string] }]
            : [];
      for (const entry of moodEntries) {
        for (const mood of entry.moods ?? []) {
          emotionBreakdown[mood] = (emotionBreakdown[mood] ?? 0) + 1;
        }
      }
    }

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

  const blockEndedWithoutCompletion = currentDay >= 25 && !blockDone;

  return {
    currentDay,
    radar,
    grid,
    streak,
    calendar,
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
    emotionBreakdown,
    blockStartDate: onboardedAt.toISOString().slice(0, 10),
  };
}
