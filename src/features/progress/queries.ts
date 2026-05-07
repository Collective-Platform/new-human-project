import { db } from "@/src/db";
import { blockDayTasks, taskCompletions } from "@/src/db/schema";
import { and, eq, asc } from "drizzle-orm";
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
  const registryTypes = new Set<string>(registryTasks.map((t) => t.type));
  // The legacy DB uses 'exercise' for Physical tasks; the registry uses type:'info'
  // with category:'Physical'. Bridge the naming gap during the migration window.
  if (registryTasks.some((t) => t.type === "info" && t.category === "Physical")) {
    registryTypes.add("exercise");
  }

  const dbTasks = await db
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
        eq(blockDayTasks.dayNumber, dayNumber),
      ),
    )
    .orderBy(asc(blockDayTasks.displayOrder));

  const merged: DayTask[] = [];

  for (const t of registryTasks) {
    merged.push({
      id: t.id,
      category: t.category,
      taskType: t.type,
      name: getLocalizedString(t.name, locale),
      // Registry tasks carry their content in `body` + frontmatter; the
      // legacy `content` jsonb is unused for them.
      content: null,
      displayOrder: t.order,
      body: t.body,
      passageRef: t.passageRef,
      scriptureRef: t.scriptureRef,
      inputs: t.inputs,
    });
  }

  for (const t of dbTasks) {
    // Registry-first: drop DB tasks whose type was already covered by the
    // registry for this (block, day). Block 1 / Day 1 has unique types so
    // dedupe-by-type is sufficient for the pilot. If a future day needs
    // multiple tasks of the same type from mixed sources, switch this to
    // dedupe by displayOrder.
    if (registryTypes.has(t.taskType)) continue;
    merged.push({
      id: t.id,
      category: t.category,
      taskType: t.taskType,
      name: t.name,
      content: t.content as Record<string, unknown> | null,
      displayOrder: t.displayOrder,
    });
  }

  merged.sort((a, b) => a.displayOrder - b.displayOrder);
  return merged;
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

/**
 * Return the set of days in `blockNumber` where the user has completed at
 * least one task. Resolves task ids through both the legacy DB task list and
 * the in-memory program registry so registry-only tasks count toward day
 * progress during the parallel-path window.
 */
export async function getDayCompletionStates(
  userId: number,
  blockNumber: number
): Promise<Map<number, boolean>> {
  const map = new Map<number, boolean>();

  const completionRows = await db
    .select({ taskId: taskCompletions.taskId })
    .from(taskCompletions)
    .where(eq(taskCompletions.userId, userId));

  // Legacy DB path: resolve completed ids against `block_day_tasks` in
  // application code. `task_completions.task_id` is text now, while legacy
  // `block_day_tasks.id` is uuid, so avoiding the SQL JOIN sidesteps
  // UUID/text operator issues during the migration window.
  const dbTasks = await db
    .select({ id: blockDayTasks.id, dayNumber: blockDayTasks.dayNumber })
    .from(blockDayTasks)
    .where(eq(blockDayTasks.blockNumber, blockNumber));
  const dbDayById = new Map(dbTasks.map((t) => [t.id, t.dayNumber]));

  for (const row of completionRows) {
    const fromDb = dbDayById.get(row.taskId);
    if (fromDb) {
      map.set(fromDb, true);
      continue;
    }

    // Registry path: registry IDs never appear in `block_day_tasks`, so
    // resolve them through the in-memory map.
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
  blockNumber: number
): Promise<Set<number>> {
  const completionRows = await db
    .select({ taskId: taskCompletions.taskId })
    .from(taskCompletions)
    .where(eq(taskCompletions.userId, userId));
  const completedIds = new Set(completionRows.map((r) => r.taskId));

  // Pull every (block, day) we know about from both sources.
  const dbDays = await db
    .selectDistinct({ dayNumber: blockDayTasks.dayNumber })
    .from(blockDayTasks)
    .where(eq(blockDayTasks.blockNumber, blockNumber));

  const days = new Set<number>(dbDays.map((d) => d.dayNumber));
  // Registry may know about days that aren't in the DB at all.
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
