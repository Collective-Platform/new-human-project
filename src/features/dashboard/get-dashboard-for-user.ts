import { cacheLife, cacheTag } from "next/cache";
import { and, asc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/src/db";
import { taskCompletions, memberBadges, badgeDefinitions } from "@/src/db/schema";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";
import { getPlanCurrentDay, getPlanDayDate } from "@/src/features/plans/queries";
import { XP_WEIGHT_BY_TYPE } from "./queries";

export interface DashboardData {
  planId?: string;
  blockNumber: number;
  currentDay: number;
  radar: { mental: number; emotional: number; physical: number };
  grid: { day: number; categoriesCompleted: number }[];
  streak: number;
  calendar: { date: string; categories: string[] }[];
  earnedBadge: {
    memberBadgeId: string;
    badgeId: string;
    name: string;
    description: string | null;
    iconUrl: string | null;
    blockNumber: number;
    earnedAt: string;
  } | null;
  emotionBreakdown: Record<string, number>;
  physicalActivityByDay: { day: number; totalMinutes: number }[];
  blockStartDate: string;
}

function safeTimezone(tz: string): string {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

type CompletionRow = { taskId: string; data: unknown };

interface BlockMetrics {
  radar: { mental: number; emotional: number; physical: number };
  grid: { day: number; categoriesCompleted: number }[];
  calendar: { date: string; categories: string[] }[];
  emotionBreakdown: Record<string, number>;
  physicalActivityByDay: { day: number; totalMinutes: number }[];
}

/**
 * Single-pass aggregation over a user's task completions, scoped to one block.
 */
function computeBlockMetrics(
  allCompletions: CompletionRow[],
  blockNumber: number,
  blockStartMs: number,
  currentDay: number,
): BlockMetrics {
  const daysElapsed = currentDay - 1;

  let mentalXp = 0;
  let emotionalCount = 0;
  let physicalCount = 0;
  const dayCategoryMap = new Map<number, Set<string>>();
  const dateCategories = new Map<string, Set<string>>();
  const emotionBreakdown: Record<string, number> = {};
  const activityByDay: Record<number, number> = {};

  // Block start at UTC midnight — calendar arithmetic must match activity-calendar.tsx.
  const blockStartUTC = new Date(blockStartMs);
  blockStartUTC.setUTCHours(0, 0, 0, 0);

  for (const { taskId, data } of allCompletions) {
    const fromRegistry = getRegistryTaskById(taskId);
    if (!fromRegistry || fromRegistry.block !== blockNumber) continue;

    const { day: dayNumber, category, type: taskType } = fromRegistry;

    if (taskType === "exercise" && data) {
      const d = data as Record<string, unknown>;
      const entries = Array.isArray(d.entries)
        ? (d.entries as Array<{ sportKey?: string; hours?: number; minutes?: number }>)
        : [];
      for (const entry of entries) {
        if (entry.sportKey === "rest") continue;
        const mins = (entry.hours ?? 0) * 60 + (entry.minutes ?? 0);
        activityByDay[dayNumber] = (activityByDay[dayNumber] ?? 0) + mins;
      }
    }

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
    const dateStr = new Date(blockStartUTC.getTime() + (dayNumber - 1) * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const dc = dateCategories.get(dateStr) ?? new Set<string>();
    dc.add(category);
    dateCategories.set(dateStr, dc);
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

  const physicalActivityByDay = Array.from({ length: 25 }, (_, i) => ({
    day: i + 1,
    totalMinutes: activityByDay[i + 1] ?? 0,
  }));

  return { radar, grid, calendar, emotionBreakdown, physicalActivityByDay };
}

export interface HomeDashboardData {
  radar: { mental: number; emotional: number; physical: number };
  streak: number;
  /** Activity by calendar date, from the 1st of the current month up to today. */
  calendar: { date: string; categories: string[] }[];
  /** First day of the current month in the member's timezone, as YYYY-MM-DD. */
  monthStartDate: string;
  emotionBreakdown: Record<string, number>;
  /** Exercise minutes for each day of the current month; `day` is the day of the month. */
  activityThisMonth: { day: number; totalMinutes: number }[];
  earnedBadge: DashboardData["earnedBadge"];
}

export type HomePlan = { id: string; blockNumber: number; startMs: number };

/**
 * Everything on Home, for all of a member's active blocks together.
 * - The triangle weights each block by the days it has run (an average, not a sum).
 * - A mood or exercise copy is skipped when the block that holds its original is
 *   loaded, so each log counts once in the charts and the calendar. It still counts
 *   in the triangle. If the original's block is not loaded, the copy counts instead.
 * - Dates come from the day each task belongs to, in the member's timezone.
 * - The streak counts any day with any completion, in any block.
 * - The calendar, the mood chart and the exercise chart show the current month and also
 *   read `finishedPlans`, so a finished block keeps its days. The triangle and the
 *   reminders use active blocks only.
 */
export async function computeHomeDashboard(
  userId: number,
  activePlans: HomePlan[],
  timezone: string,
  finishedPlans: HomePlan[] = [],
): Promise<HomeDashboardData> {
  const tz = safeTimezone(timezone);
  const today = getPlanDayDate(new Date(), 1, tz);
  const todayDate = today.toISOString().slice(0, 10);
  const monthStartDate = `${todayDate.slice(0, 8)}01`;

  const streakQ = db.execute<{ streak: number }>(sql`
    WITH completion_dates AS (
      SELECT DISTINCT (tc.completed_at AT TIME ZONE ${tz})::date AS d
      FROM nhp.task_completions tc
      WHERE tc.user_id = ${userId}
        AND (tc.completed_at AT TIME ZONE ${tz})::date <= (NOW() AT TIME ZONE ${tz})::date
    ),
    numbered AS (
      SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d ASC))::int AS grp
      FROM completion_dates
    )
    SELECT COUNT(*)::int AS streak
    FROM numbered
    WHERE grp = (
      SELECT grp FROM numbered
      WHERE d >= (NOW() AT TIME ZONE ${tz})::date - 1
      ORDER BY d DESC
      LIMIT 1
    )
  `);
  const planIds = [...activePlans, ...finishedPlans].map((plan) => plan.id);
  const rowsQ =
    planIds.length === 0
      ? Promise.resolve([])
      : db
          .select({
            planId: taskCompletions.planId,
            taskId: taskCompletions.taskId,
            data: taskCompletions.data,
          })
          .from(taskCompletions)
          .where(and(eq(taskCompletions.userId, userId), inArray(taskCompletions.planId, planIds)));
  // A badge is earned when its plan finishes, so its plan is never in activePlans.
  // Legacy badges have no plan and are not celebrated.
  const badgeQ = db
    .select({
      badgeId: memberBadges.badgeId,
      memberBadgeId: memberBadges.id,
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
        isNotNull(memberBadges.planId),
        isNull(memberBadges.seenAt),
      ),
    )
    .orderBy(asc(memberBadges.earnedAt))
    .limit(1);

  const [streakResult, rows, badgeRows] = await Promise.all([streakQ, rowsQ, badgeQ]);
  const streakRow = (streakResult as unknown as { rows: { streak: number }[] }).rows[0];
  const badge = badgeRows[0];

  // The calendar and both charts read every block, finished or not.
  const planById = new Map([...activePlans, ...finishedPlans].map((plan) => [plan.id, plan]));
  const logKey = (plan: HomePlan, task: { day: number; type: string }) =>
    `${getPlanDayDate(new Date(plan.startMs), task.day, tz).toISOString().slice(0, 10)}:${task.type}`;
  const categoriesByDate = new Map<string, Set<string>>();
  const minutesByDate = new Map<string, number>();
  const emotionBreakdown: Record<string, number> = {};
  // A copied log counts only when its original block is not loaded here (the
  // original's block finished, was deleted or was left), and only once for each
  // date and type. The date match below is the fallback for that case.
  const originalLogKeys = new Set<string>();
  for (const row of rows) {
    const plan = row.planId ? planById.get(row.planId) : undefined;
    const task = getRegistryTaskById(row.taskId);
    if (!plan || !task || task.block !== plan.blockNumber) continue;
    if (((row.data ?? {}) as Record<string, unknown>).syncedFromPlanId !== undefined) continue;
    originalLogKeys.add(logKey(plan, task));
  }
  const countedCopyKeys = new Set<string>();
  for (const row of rows) {
    const plan = row.planId ? planById.get(row.planId) : undefined;
    const task = getRegistryTaskById(row.taskId);
    if (!plan || !task || task.block !== plan.blockNumber) continue;

    // A copy whose original block is loaded adds nothing: the original already
    // counts the log. Match by block, not by date, because a block older than
    // 25 days holds today's copy on its Day 25, which has an older date.
    const sourcePlanId = ((row.data ?? {}) as Record<string, unknown>).syncedFromPlanId;
    if (
      typeof sourcePlanId === "string" &&
      sourcePlanId !== row.planId &&
      planById.has(sourcePlanId)
    ) {
      continue;
    }

    const dateStr = getPlanDayDate(new Date(plan.startMs), task.day, tz).toISOString().slice(0, 10);
    const inMonth = dateStr >= monthStartDate && dateStr <= todayDate;
    if (inMonth) {
      const categories = categoriesByDate.get(dateStr) ?? new Set<string>();
      categories.add(task.category);
      categoriesByDate.set(dateStr, categories);
    }

    const data = (row.data ?? {}) as Record<string, unknown>;
    if (data.syncedFromPlanId !== undefined) {
      const key = logKey(plan, task);
      if (originalLogKeys.has(key) || countedCopyKeys.has(key)) continue;
      countedCopyKeys.add(key);
    }

    if (task.type === "exercise" && inMonth) {
      const entries = Array.isArray(data.entries)
        ? (data.entries as Array<{ sportKey?: string; hours?: number; minutes?: number }>)
        : [];
      for (const entry of entries) {
        if (entry.sportKey === "rest") continue;
        const minutes = (entry.hours ?? 0) * 60 + (entry.minutes ?? 0);
        minutesByDate.set(dateStr, (minutesByDate.get(dateStr) ?? 0) + minutes);
      }
    }
    if (task.type === "mood_log" && inMonth) {
      const moodEntries: { moods?: string[] }[] = Array.isArray(data.entries)
        ? (data.entries as { moods?: string[] }[])
        : Array.isArray(data.moods)
          ? [{ moods: data.moods as string[] }]
          : data.mood
            ? [{ moods: [data.mood as string] }]
            : [];
      for (const entry of moodEntries) {
        for (const mood of entry.moods ?? []) {
          emotionBreakdown[mood] = (emotionBreakdown[mood] ?? 0) + 1;
        }
      }
    }
  }

  // Triangle: one score set per block, averaged by days elapsed.
  let totalWeight = 0;
  const sum = { mental: 0, emotional: 0, physical: 0 };
  for (const plan of activePlans) {
    const currentDay = getPlanCurrentDay(new Date(plan.startMs), tz);
    const weight = Math.max(currentDay - 1, 0);
    if (weight === 0) continue;
    const { radar } = computeBlockMetrics(
      rows.filter((row) => row.planId === plan.id),
      plan.blockNumber,
      plan.startMs,
      currentDay,
    );
    totalWeight += weight;
    sum.mental += radar.mental * weight;
    sum.emotional += radar.emotional * weight;
    sum.physical += radar.physical * weight;
  }

  const daysInMonth = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const activityThisMonth = Array.from({ length: daysInMonth }, (_, index) => ({
    day: index + 1,
    totalMinutes:
      minutesByDate.get(`${monthStartDate.slice(0, 8)}${String(index + 1).padStart(2, "0")}`) ?? 0,
  }));

  return {
    radar:
      totalWeight === 0
        ? { mental: 0, emotional: 0, physical: 0 }
        : {
            mental: sum.mental / totalWeight,
            emotional: sum.emotional / totalWeight,
            physical: sum.physical / totalWeight,
          },
    streak: streakRow ? Number(streakRow.streak) : 0,
    calendar: Array.from(categoriesByDate.entries())
      .map(([date, categories]) => ({ date, categories: Array.from(categories) }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    monthStartDate,
    emotionBreakdown,
    activityThisMonth,
    earnedBadge: badge
      ? {
          badgeId: badge.badgeId,
          memberBadgeId: badge.memberBadgeId,
          name: badge.name,
          description: badge.description,
          iconUrl: badge.iconUrl,
          blockNumber: badge.blockNumber,
          earnedAt: badge.earnedAt.toISOString(),
        }
      : null,
  };
}

export async function getHomeDashboard(
  userId: number,
  activePlans: HomePlan[],
  timezone: string,
  finishedPlans: HomePlan[] = [],
): Promise<HomeDashboardData> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`dashboard:${userId}`);
  return computeHomeDashboard(userId, activePlans, timezone, finishedPlans);
}
