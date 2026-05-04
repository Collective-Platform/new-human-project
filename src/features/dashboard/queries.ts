import { db } from "@/src/db";
import { blockDayTasks, taskCompletions } from "@/src/db/schema";
import { and, eq, sql, desc, gte, lt } from "drizzle-orm";

export function getCurrentDay(onboardedAt: Date): number {
  const msPerDay = 86_400_000;
  const daysElapsed = Math.floor(
    (Date.now() - onboardedAt.getTime()) / msPerDay
  );
  return Math.min(Math.max(daysElapsed + 1, 1), 25);
}

export async function getVerseOfTheDay(
  blockNumber: number,
  dayNumber: number
) {
  const rows = await db
    .select({
      id: blockDayTasks.id,
      name: blockDayTasks.name,
      content: blockDayTasks.content,
    })
    .from(blockDayTasks)
    .where(
      and(
        eq(blockDayTasks.blockNumber, blockNumber),
        eq(blockDayTasks.dayNumber, dayNumber),
        eq(blockDayTasks.taskType, "scripture_memorise")
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getRadarChartData(
  userId: number,
  blockNumber: number,
  daysElapsed: number
): Promise<{ mental: number; emotional: number; physical: number }> {
  if (daysElapsed <= 0) return { mental: 0, emotional: 0, physical: 0 };

  const result = await db.execute(sql`
    SELECT
      COALESCE(SUM(CASE WHEN bdt.category = 'Mental' THEN (bdt.content->>'xp_weight')::int ELSE 0 END), 0) AS mental_xp,
      COALESCE(COUNT(CASE WHEN bdt.category = 'Emotional' THEN 1 END), 0) AS emotional_count,
      COALESCE(COUNT(CASE WHEN bdt.category = 'Physical' THEN 1 END), 0) AS physical_count
    FROM nhp.task_completions tc
    JOIN nhp.block_day_tasks bdt ON tc.task_id = bdt.id
    WHERE tc.user_id = ${userId}
      AND bdt.block_number = ${blockNumber}
  `);

  const row = result.rows[0] as {
    mental_xp: number;
    emotional_count: number;
    physical_count: number;
  } | undefined;

  if (!row) return { mental: 0, emotional: 0, physical: 0 };

  return {
    mental: Math.min((Number(row.mental_xp) / (daysElapsed * 3)) * 100, 100),
    emotional: Math.min(
      (Number(row.emotional_count) / daysElapsed) * 100,
      100
    ),
    physical: Math.min(
      (Number(row.physical_count) / daysElapsed) * 100,
      100
    ),
  };
}

export async function getBlockGrid(
  userId: number,
  blockNumber: number,
  currentDay: number
): Promise<{ day: number; categoriesCompleted: number }[]> {
  const result = await db.execute(sql`
    SELECT bdt.day_number, COUNT(DISTINCT bdt.category)::int AS categories
    FROM nhp.task_completions tc
    JOIN nhp.block_day_tasks bdt ON tc.task_id = bdt.id
    WHERE tc.user_id = ${userId} AND bdt.block_number = ${blockNumber}
    GROUP BY bdt.day_number
  `);

  const completionMap = new Map<number, number>();
  for (const row of result.rows as { day_number: number; categories: number }[]) {
    completionMap.set(Number(row.day_number), Number(row.categories));
  }

  return Array.from({ length: 25 }, (_, i) => {
    const day = i + 1;
    if (day > currentDay) return { day, categoriesCompleted: -1 };
    return { day, categoriesCompleted: completionMap.get(day) ?? 0 };
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
  endDate: Date
): Promise<{ date: string; categories: string[] }[]> {
  const result = await db.execute(sql`
    SELECT tc.completed_at::date AS d, array_agg(DISTINCT bdt.category) AS categories
    FROM nhp.task_completions tc
    JOIN nhp.block_day_tasks bdt ON tc.task_id = bdt.id
    WHERE tc.user_id = ${userId}
      AND tc.completed_at >= ${startDate}
      AND tc.completed_at < ${endDate}
    GROUP BY tc.completed_at::date
    ORDER BY d
  `);

  return (result.rows as { d: string; categories: string[] }[]).map((r) => ({
    date: String(r.d),
    categories: r.categories,
  }));
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

  return db
    .select({
      completedAt: taskCompletions.completedAt,
      category: blockDayTasks.category,
      name: blockDayTasks.name,
      taskType: blockDayTasks.taskType,
    })
    .from(taskCompletions)
    .innerJoin(blockDayTasks, eq(taskCompletions.taskId, blockDayTasks.id))
    .where(and(...conditions))
    .orderBy(desc(taskCompletions.completedAt))
    .limit(limit);
}

export async function getDayCompletions(userId: number, date: Date) {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  return db
    .select({
      completedAt: taskCompletions.completedAt,
      category: blockDayTasks.category,
      name: blockDayTasks.name,
      taskType: blockDayTasks.taskType,
      data: taskCompletions.data,
    })
    .from(taskCompletions)
    .innerJoin(blockDayTasks, eq(taskCompletions.taskId, blockDayTasks.id))
    .where(
      and(
        eq(taskCompletions.userId, userId),
        gte(taskCompletions.completedAt, date),
        lt(taskCompletions.completedAt, nextDay)
      )
    )
    .orderBy(blockDayTasks.displayOrder);
}
