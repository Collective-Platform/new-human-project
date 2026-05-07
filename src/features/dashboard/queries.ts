import { db } from "@/src/db";
import { blockDayTasks, taskCompletions } from "@/src/db/schema";
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

// XP weight by task type — mirrors the `xp_weight` column in the legacy seed.
// Used when resolving Mental XP for registry tasks that have no DB content JSON.
const XP_WEIGHT_BY_TYPE: Record<string, number> = {
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

  const dbTasks = await db
    .select({
      id: blockDayTasks.id,
      category: blockDayTasks.category,
      taskType: blockDayTasks.taskType,
      content: blockDayTasks.content,
    })
    .from(blockDayTasks)
    .where(eq(blockDayTasks.blockNumber, blockNumber));
  const dbTaskMap = new Map(dbTasks.map((t) => [t.id, t]));

  let mentalXp = 0;
  let emotionalCount = 0;
  let physicalCount = 0;

  for (const row of completionRows) {
    const fromRegistry = getRegistryTaskById(row.taskId);
    if (fromRegistry && fromRegistry.block === blockNumber) {
      if (fromRegistry.category === "Mental") {
        mentalXp += XP_WEIGHT_BY_TYPE[fromRegistry.type] ?? 1;
      } else if (fromRegistry.category === "Emotional") {
        emotionalCount++;
      } else if (fromRegistry.category === "Physical") {
        physicalCount++;
      }
      continue;
    }

    const fromDb = dbTaskMap.get(row.taskId);
    if (fromDb) {
      if (fromDb.category === "Mental") {
        const w = (fromDb.content as Record<string, unknown> | null)?.xp_weight;
        mentalXp += typeof w === "number" ? w : 1;
      } else if (fromDb.category === "Emotional") {
        emotionalCount++;
      } else if (fromDb.category === "Physical") {
        physicalCount++;
      }
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

  const dbTasks = await db
    .select({
      id: blockDayTasks.id,
      dayNumber: blockDayTasks.dayNumber,
      category: blockDayTasks.category,
    })
    .from(blockDayTasks)
    .where(eq(blockDayTasks.blockNumber, blockNumber));
  const dbTaskMap = new Map(dbTasks.map((t) => [t.id, t]));

  // day → distinct categories completed
  const dayCategoryMap = new Map<number, Set<string>>();

  for (const row of completionRows) {
    let dayNumber: number | undefined;
    let category: string | undefined;

    const fromRegistry = getRegistryTaskById(row.taskId);
    if (fromRegistry && fromRegistry.block === blockNumber) {
      dayNumber = fromRegistry.day;
      category = fromRegistry.category;
    } else {
      const fromDb = dbTaskMap.get(row.taskId);
      if (fromDb) {
        dayNumber = fromDb.dayNumber;
        category = fromDb.category;
      }
    }

    if (dayNumber === undefined || category === undefined) continue;
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
  const completionRows = await db
    .select({ taskId: taskCompletions.taskId })
    .from(taskCompletions)
    .where(eq(taskCompletions.userId, userId));

  if (completionRows.length === 0) return [];

  const dbTasks = await db
    .select({
      id: blockDayTasks.id,
      dayNumber: blockDayTasks.dayNumber,
      category: blockDayTasks.category,
    })
    .from(blockDayTasks);
  const dbTaskMap = new Map(dbTasks.map((t) => [t.id, t]));

  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  // date string → distinct categories
  const dateCategories = new Map<string, Set<string>>();

  for (const row of completionRows) {
    let dayNumber: number | undefined;
    let category: string | undefined;

    const fromRegistry = getRegistryTaskById(row.taskId);
    if (fromRegistry) {
      dayNumber = fromRegistry.day;
      category = fromRegistry.category;
    } else {
      const fromDb = dbTaskMap.get(row.taskId);
      if (fromDb) {
        dayNumber = fromDb.dayNumber;
        category = fromDb.category;
      }
    }

    if (dayNumber === undefined || category === undefined) continue;

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

  // Load all block 1 DB tasks and look up in memory — same pattern as progress/queries.ts.
  // Avoids the UUID/text array binding issue and is fine for the small task count.
  const dbTaskRows = await db
    .select({
      id: blockDayTasks.id,
      category: blockDayTasks.category,
      name: blockDayTasks.name,
      taskType: blockDayTasks.taskType,
    })
    .from(blockDayTasks)
    .where(eq(blockDayTasks.blockNumber, 1));
  const dbTaskMap = new Map(dbTaskRows.map((t) => [t.id, t]));

  const result: { completedAt: Date; category: string; name: string; taskType: string }[] = [];
  for (const row of rows) {
    const fromRegistry = getRegistryTaskById(row.taskId);
    if (fromRegistry) {
      result.push({
        completedAt: row.completedAt,
        category: fromRegistry.category,
        name: getLocalizedString(fromRegistry.name, "en"),
        taskType: fromRegistry.type,
      });
      continue;
    }
    const fromDb = dbTaskMap.get(row.taskId);
    if (fromDb) {
      result.push({
        completedAt: row.completedAt,
        category: fromDb.category,
        name: fromDb.name,
        taskType: fromDb.taskType,
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

  const dbTasks = await db
    .select({
      id: blockDayTasks.id,
      dayNumber: blockDayTasks.dayNumber,
      category: blockDayTasks.category,
      name: blockDayTasks.name,
      taskType: blockDayTasks.taskType,
      displayOrder: blockDayTasks.displayOrder,
    })
    .from(blockDayTasks);
  const dbTaskMap = new Map(dbTasks.map((t) => [t.id, t]));

  const targetDateStr = new Date(date).toISOString().slice(0, 10);

  const matched: { completedAt: Date; category: string; name: string; taskType: string; data: unknown; displayOrder: number }[] = [];

  for (const row of completionRows) {
    let dayNumber: number | undefined;
    let category: string | undefined;
    let name: string | undefined;
    let taskType: string | undefined;
    let displayOrder = 0;

    const fromRegistry = getRegistryTaskById(row.taskId);
    if (fromRegistry) {
      dayNumber = fromRegistry.day;
      category = fromRegistry.category;
      name = getLocalizedString(fromRegistry.name, "en");
      taskType = fromRegistry.type;
      displayOrder = fromRegistry.order;
    } else {
      const fromDb = dbTaskMap.get(row.taskId);
      if (fromDb) {
        dayNumber = fromDb.dayNumber;
        category = fromDb.category;
        name = fromDb.name;
        taskType = fromDb.taskType;
        displayOrder = fromDb.displayOrder;
      }
    }

    if (dayNumber === undefined || !category || !name || !taskType) continue;

    const assigned = new Date(onboardedAt);
    assigned.setDate(assigned.getDate() + dayNumber - 1);
    if (assigned.toISOString().slice(0, 10) !== targetDateStr) continue;

    matched.push({ completedAt: row.completedAt, category, name, taskType, data: row.data, displayOrder });
  }

  matched.sort((a, b) => a.displayOrder - b.displayOrder);
  return matched.map(({ displayOrder: _, ...rest }) => rest);
}
