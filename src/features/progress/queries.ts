import { db } from "@/src/db";
import { taskCompletions } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import {
  getDayTasks as getRegistryDayTasks,
  getTaskById as getRegistryTaskById,
} from "@/src/features/content/program";
import { getLocalizedString } from "@/src/features/content";

/**
 * Unified shape returned by {@link getDayTasks}. Combines the legacy DB
 * `block_day_tasks` row shape with the optional fields that come from the
 * markdown program registry (`data/program/**\/*.md`).
 *
 * Registry-backed tasks set `body`, `passageRef` / `scriptureRef` (if
 * present in frontmatter), and `inputs`. DB-backed tasks leave them
 * undefined. The renderer uses presence of `body` as the feature switch
 * between {@link SectionedContentRenderer} and the legacy renderers.
 */
export interface DayTask {
  id: string;
  category: string;
  taskType: string;
  name: string;
  content: Record<string, unknown> | null;
  displayOrder: number;

  // Registry-only fields. Undefined for DB-backed tasks.
  body?: string;
  passageRef?: string;
  scriptureRef?: string;
  inputs?: string[];
}

/**
 * Return the merged task list for `(block, day)`. Registry tasks (markdown
 * files) take precedence over DB tasks of the same `taskType` — the design
 * doc's "parallel data path: registry first, fall back to DB". Once Block 1
 * is fully migrated and the DB cutover ships, the DB branch goes away.
 */
export async function getDayTasks(
  blockNumber: number,
  dayNumber: number,
  locale: "en" | "zh" = "en",
): Promise<DayTask[]> {
  const registryTasks = getRegistryDayTasks(blockNumber, dayNumber);

  const merged: DayTask[] = registryTasks.map((t) => ({
    id: t.id,
    category: t.category,
    taskType: t.type,
    name: getLocalizedString(t.name, locale),
    content: null,
    displayOrder: t.order,
    body: t.body,
    passageRef: t.passageRef,
    scriptureRef: t.scriptureRef,
    inputs: t.inputs,
  }));

  merged.sort((a, b) => a.displayOrder - b.displayOrder);
  return merged;
}

export async function getUserCompletions(
  userId: number,
  taskIds: string[],
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

/**
 * Return the set of days in `blockNumber` where the user has completed at
 * least one task. Resolves task ids through both the legacy DB task list and
 * the in-memory program registry so registry-only tasks count toward day
 * progress during the parallel-path window.
 */
export async function getDayCompletionStates(
  userId: number,
  blockNumber: number,
): Promise<Map<number, boolean>> {
  const map = new Map<number, boolean>();

  const completionRows = await db
    .select({ taskId: taskCompletions.taskId })
    .from(taskCompletions)
    .where(eq(taskCompletions.userId, userId));

  for (const row of completionRows) {
    const t = getRegistryTaskById(row.taskId);
    if (t && t.block === blockNumber) map.set(t.day, true);
  }

  return map;
}

/**
 * Return the set of days in `blockNumber` where the user has completed
 * every task. Considers tasks from both sources (registry-first, with DB
 * filling in any types the registry doesn't cover) — same merge rule as
 * {@link getDayTasks}.
 */
export async function getFullyCompletedDays(
  userId: number,
  blockNumber: number,
): Promise<Set<number>> {
  const completionRows = await db
    .select({ taskId: taskCompletions.taskId })
    .from(taskCompletions)
    .where(eq(taskCompletions.userId, userId));
  const completedIds = new Set(completionRows.map((r) => r.taskId));

  const days = new Set<number>();
  for (let day = 1; day <= 25; day++) {
    if (getRegistryDayTasks(blockNumber, day).length > 0) days.add(day);
  }

  const fully = new Set<number>();
  for (const day of days) {
    const tasks = await getDayTasks(blockNumber, day);
    if (tasks.length === 0) continue;
    const allDone = tasks.every((t) => completedIds.has(t.id));
    if (allDone) fully.add(day);
  }

  return fully;
}
