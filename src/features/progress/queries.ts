import { db } from "@/src/db";
import { blockDayTasks, taskCompletions } from "@/src/db/schema";
import { and, eq, asc, sql } from "drizzle-orm";

export async function getDayTasks(blockNumber: number, dayNumber: number) {
  return db
    .select({
      id: blockDayTasks.id,
      category: blockDayTasks.category,
      taskType: blockDayTasks.taskType,
      name: blockDayTasks.name,
      content: blockDayTasks.content,
      displayOrder: blockDayTasks.displayOrder,
    })
    .from(blockDayTasks)
    .where(
      and(
        eq(blockDayTasks.blockNumber, blockNumber),
        eq(blockDayTasks.dayNumber, dayNumber)
      )
    )
    .orderBy(asc(blockDayTasks.displayOrder));
}

export async function getUserCompletions(
  userId: number,
  taskIds: string[]
): Promise<Map<string, Record<string, unknown> | null>> {
  if (taskIds.length === 0) return new Map();

  const completions = await db
    .select({ taskId: taskCompletions.taskId, data: taskCompletions.data })
    .from(taskCompletions)
    .where(eq(taskCompletions.userId, userId));

  const taskIdSet = new Set(taskIds);
  const completedMap = new Map<string, Record<string, unknown> | null>();
  for (const c of completions) {
    if (taskIdSet.has(c.taskId)) {
      completedMap.set(c.taskId, c.data as Record<string, unknown> | null);
    }
  }
  return completedMap;
}

export async function getDayCompletionStates(
  userId: number,
  blockNumber: number
): Promise<Map<number, boolean>> {
  const result = await db.execute(sql`
    SELECT DISTINCT bdt.day_number
    FROM task_completions tc
    JOIN block_day_tasks bdt ON tc.task_id = bdt.id
    WHERE tc.user_id = ${userId} AND bdt.block_number = ${blockNumber}
  `);

  const map = new Map<number, boolean>();
  for (const row of result.rows as { day_number: number }[]) {
    map.set(Number(row.day_number), true);
  }
  return map;
}

export async function getFullyCompletedDays(
  userId: number,
  blockNumber: number
): Promise<Set<number>> {
  const result = await db.execute(sql`
    SELECT bdt.day_number
    FROM block_day_tasks bdt
    LEFT JOIN task_completions tc
      ON tc.task_id = bdt.id AND tc.user_id = ${userId}
    WHERE bdt.block_number = ${blockNumber}
    GROUP BY bdt.day_number
    HAVING COUNT(DISTINCT bdt.id) > 0
       AND COUNT(DISTINCT bdt.id) = COUNT(DISTINCT tc.task_id)
  `);

  const set = new Set<number>();
  for (const row of result.rows as { day_number: number }[]) {
    set.add(Number(row.day_number));
  }
  return set;
}
