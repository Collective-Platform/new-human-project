import { db } from "@/src/db";
import { taskCompletions } from "@/src/db/schema";
import { and, eq, sql, desc, gte } from "drizzle-orm";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";
import { getLocalizedString } from "@/src/features/content";

export function getCurrentDay(onboardedAt: Date): number {
  const msPerDay = 86_400_000;
  const daysElapsed = Math.floor(
    (Date.now() - onboardedAt.getTime()) / msPerDay
  );
  return Math.min(Math.max(daysElapsed + 1, 1), 25);
}

// XP weight by task type — mirrors the `xp_weight` column in the legacy seed.
// Used when resolving Mental XP for registry tasks that have no DB content JSON.
export const XP_WEIGHT_BY_TYPE: Record<string, number> = {
  devotional: 2,
  scripture_study: 2,
  scripture_reading: 1,
  info: 1,
  mood_log: 0,
};

export async function getRadarChartData(
  userId: number,
  blockNumber: number,
  daysElapsed: number
): Promise<{ mental: number; emotional: number; physical: number }> {
  if (daysElapsed <= 0) return { mental: 0, emotional: 0, physical: 0 };

  const completionRows = await db
    .select({ taskId: taskCompletions.taskId })
    .from(taskCompletions)
    .where(eq(taskCompletions.userId, userId));

  if (completionRows.length === 0) return { mental: 0, emotional: 0, physical: 0 };

  let mentalXp = 0;
  let emotionalCount = 0;
  let physicalCount = 0;

  for (const row of completionRows) {
    const task = getRegistryTaskById(row.taskId);
    if (!task || task.block !== blockNumber) continue;
    if (task.category === "Mental") {
      mentalXp += XP_WEIGHT_BY_TYPE[task.type] ?? 1;
    } else if (task.category === "Emotional") {
      emotionalCount++;
    } else if (task.category === "Physical") {
      physicalCount++;
    }
  }

  return {
    mental: Math.min((mentalXp / (daysElapsed * 3)) * 100, 100),
    emotional: Math.min((emotionalCount / daysElapsed) * 100, 100),
    physical: Math.min((physicalCount / daysElapsed) * 100, 100),
  };
}

export async function getBlockGrid(
  userId: number,
  blockNumber: number,
  currentDay: number
): Promise<{ day: number; categoriesCompleted: number }[]> {
  const completionRows = await db
    .select({ taskId: taskCompletions.taskId })
    .from(taskCompletions)
    .where(eq(taskCompletions.userId, userId));

  // day → distinct categories completed
  const dayCategoryMap = new Map<number, Set<string>>();

  for (const row of completionRows) {
    const task = getRegistryTaskById(row.taskId);
    if (!task || task.block !== blockNumber) continue;
    const dayNumber = task.day;
    const category = task.category;
    const cats = dayCategoryMap.get(dayNumber) ?? new Set<string>();
    cats.add(category);
    dayCategoryMap.set(dayNumber, cats);
  }

  return Array.from({ length: 25 }, (_, i) => {
    const day = i + 1;
    if (day > currentDay) return { day, categoriesCompleted: -1 };
    return { day, categoriesCompleted: dayCategoryMap.get(day)?.size ?? 0 };
  });
}

export async function getStreak(userId: number): Promise<number> {
  const result = await db.execute(sql`
    WITH completion_dates AS (
      SELECT DISTINCT tc.completed_at::date AS d
      FROM nhp.task_completions tc
      WHERE tc.user_id = ${userId}
    ),
    numbered AS (
      SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d DESC))::int AS grp
      FROM completion_dates
      WHERE d <= CURRENT_DATE
    )
    SELECT COUNT(*)::int AS streak
    FROM numbered
    WHERE grp = (SELECT grp FROM numbered WHERE d = CURRENT_DATE LIMIT 1)
  `);

  const row = result.rows[0] as { streak: number } | undefined;
  return row ? Number(row.streak) : 0;
}

export async function getActivityCalendar(
  userId: number,
  startDate: Date,
  endDate: Date,
  onboardedAt: Date
): Promise<{ date: string; categories: string[] }[]> {
  // Pre-filter completions by completedAt to reduce rows transferred.
  // JS-side verification still uses the task's assigned date (onboardedAt + dayNumber).
  const completionRows = await db
    .select({ taskId: taskCompletions.taskId })
    .from(taskCompletions)
    .where(
      and(
        eq(taskCompletions.userId, userId),
        gte(taskCompletions.completedAt, startDate)
      )
    );

  if (completionRows.length === 0) return [];

  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  // date string → distinct categories
  const dateCategories = new Map<string, Set<string>>();

  for (const row of completionRows) {
    const task = getRegistryTaskById(row.taskId);
    if (!task) continue;
    const dayNumber = task.day;
    const category = task.category;

    const assigned = new Date(onboardedAt);
    assigned.setDate(assigned.getDate() + dayNumber - 1);
    assigned.setHours(0, 0, 0, 0);
    const ms = assigned.getTime();
    if (ms < startMs || ms >= endMs) continue;

    const dateStr = assigned.toISOString().slice(0, 10);
    const cats = dateCategories.get(dateStr) ?? new Set<string>();
    cats.add(category);
    dateCategories.set(dateStr, cats);
  }

  return Array.from(dateCategories.entries())
    .map(([date, cats]) => ({ date, categories: Array.from(cats) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getRecentCompletions(
  userId: number,
  limit: number = 10,
  startDate?: Date
) {
  const conditions = [eq(taskCompletions.userId, userId)];
  if (startDate) {
    conditions.push(gte(taskCompletions.completedAt, startDate));
  }

  // Fetch without JOIN — registry tasks (ULID ids) have no row in block_day_tasks
  const rows = await db
    .select({
      taskId: taskCompletions.taskId,
      completedAt: taskCompletions.completedAt,
    })
    .from(taskCompletions)
    .where(and(...conditions))
    .orderBy(desc(taskCompletions.completedAt))
    .limit(limit);

  if (rows.length === 0) return [];

  const result: { completedAt: Date; category: string; name: string; taskType: string }[] = [];
  for (const row of rows) {
    const task = getRegistryTaskById(row.taskId);
    if (task) {
      result.push({
        completedAt: row.completedAt,
        category: task.category,
        name: getLocalizedString(task.name, "en"),
        taskType: task.type,
      });
    }
  }

  return result;
}

export async function getDayCompletions(
  userId: number,
  date: Date,
  onboardedAt: Date
): Promise<{ completedAt: Date; category: string; name: string; taskType: string; data: unknown }[]> {
  const completionRows = await db
    .select({
      taskId: taskCompletions.taskId,
      completedAt: taskCompletions.completedAt,
      data: taskCompletions.data,
    })
    .from(taskCompletions)
    .where(eq(taskCompletions.userId, userId));

  if (completionRows.length === 0) return [];

  const targetDateStr = new Date(date).toISOString().slice(0, 10);

  const matched: { completedAt: Date; category: string; name: string; taskType: string; data: unknown; displayOrder: number }[] = [];

  for (const row of completionRows) {
    const task = getRegistryTaskById(row.taskId);
    if (!task) continue;
    const dayNumber = task.day;
    const category = task.category;
    const name = getLocalizedString(task.name, "en");
    const taskType = task.type;
    const displayOrder = task.order;

    const assigned = new Date(onboardedAt);
    assigned.setDate(assigned.getDate() + dayNumber - 1);
    if (assigned.toISOString().slice(0, 10) !== targetDateStr) continue;

    matched.push({ completedAt: row.completedAt, category, name, taskType, data: row.data, displayOrder });
  }

  matched.sort((a, b) => a.displayOrder - b.displayOrder);
  return matched.map(({ displayOrder: _displayOrder, ...rest }) => rest);
}
