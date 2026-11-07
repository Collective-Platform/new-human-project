import { cookies } from "next/headers";
import { and, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/src/db";
import { planCompletions, planMembers, plans, taskCompletions } from "@/src/db/schema";
import { getDayTasks, getTaskById } from "@/src/features/content/program";
import {
  getPlanCurrentDay,
  getPlanDayDate,
  getPlanDayOnDate,
  isPlanPastLastDay,
} from "@/src/features/plans/queries";
import { finishPlanIfComplete } from "./plan-finish";

/**
 * Mood and exercise are things a member does once a day, whatever blocks they
 * run. Each block still has its own mood and exercise task, so a log saved in
 * one block is copied to the same-day task of every other active block.
 *
 * Two rules decide where a log goes:
 * - A log for a block's current day is a "today" log. It goes to the current day
 *   of every other active block, the day each block opens on.
 * - A log for an earlier day is a backfill. It goes to the day that falls on the
 *   same calendar date in each other block. Blocks not running on that date get no copy.
 *
 * A block past its 25 days neither sends nor receives copies. Its current day stays
 * Day 25, so a copy would overwrite that day's real log with a log from another date.
 *
 * A copy carries `data.syncedFromPlanId`. Feed queries skip copies, so friends
 * see one log, not one per block.
 */
const SHARED_TASK_TYPES = ["mood_log", "exercise"];
export const SYNC_MARKER = "syncedFromPlanId";

type PlanSummary = { id: string; blockNumber: number; startedAt: Date };
type LogTask = { id: string; type: string; day: number };
type Target = { plan: PlanSummary; taskId: string };
type LogData = Record<string, unknown>;

/** The block that holds the original of a log: the marker if the row is a copy, else its own block. */
function originOf(marker: unknown, ownPlanId: string): string {
  return typeof marker === "string" ? marker : ownPlanId;
}

export function isSharedLogType(type: string) {
  return SHARED_TASK_TYPES.includes(type);
}

export async function getRequestTimezone() {
  const cookieStore = await cookies();
  return decodeURIComponent(cookieStore.get("tz")?.value ?? "UTC");
}

/** The member's other unfinished blocks that are still inside their 25 days. */
async function getOtherSharingPlans(
  userId: number,
  exceptPlanId: string,
  timezone: string,
): Promise<PlanSummary[]> {
  const rows = await db
    .select({ id: plans.id, blockNumber: plans.blockNumber, startedAt: plans.startedAt })
    .from(planMembers)
    .innerJoin(plans, eq(planMembers.planId, plans.id))
    .leftJoin(
      planCompletions,
      and(eq(planCompletions.planId, plans.id), eq(planCompletions.userId, userId)),
    )
    .where(
      and(
        eq(planMembers.userId, userId),
        eq(planMembers.status, "active"),
        isNull(planCompletions.id),
        ne(plans.id, exceptPlanId),
      ),
    );
  return rows.filter((plan) => !isPlanPastLastDay(plan.startedAt, timezone));
}

function todaysTaskOfType(plan: PlanSummary, type: string, timezone: string) {
  const day = getPlanCurrentDay(plan.startedAt, timezone);
  return getDayTasks(plan.blockNumber, day).find((task) => task.type === type);
}

/** The other blocks that should receive this log, with the matching task in each. */
async function getSyncTargets(
  userId: number,
  source: PlanSummary,
  task: LogTask,
  timezone: string,
): Promise<Target[]> {
  if (!isSharedLogType(task.type) || isPlanPastLastDay(source.startedAt, timezone)) return [];
  const sourceToday = getPlanCurrentDay(source.startedAt, timezone);
  if (task.day > sourceToday) return [];
  const isTodayLog = task.day === sourceToday;
  const date = getPlanDayDate(source.startedAt, task.day, timezone);
  const others = await getOtherSharingPlans(userId, source.id, timezone);
  const targets: Target[] = [];
  for (const plan of others) {
    const day = isTodayLog
      ? getPlanCurrentDay(plan.startedAt, timezone)
      : getPlanDayOnDate(plan.startedAt, date, timezone);
    if (day === null) continue;
    const match = getDayTasks(plan.blockNumber, day).find((item) => item.type === task.type);
    if (match) targets.push({ plan, taskId: match.id });
  }
  return targets;
}

async function getExistingData(userId: number, targets: Target[]) {
  if (targets.length === 0) return new Map<string, LogData | null>();
  const rows = await db
    .select({
      planId: taskCompletions.planId,
      taskId: taskCompletions.taskId,
      data: taskCompletions.data,
    })
    .from(taskCompletions)
    .where(
      and(
        eq(taskCompletions.userId, userId),
        inArray(
          taskCompletions.planId,
          targets.map((target) => target.plan.id),
        ),
        inArray(
          taskCompletions.taskId,
          targets.map((target) => target.taskId),
        ),
      ),
    );
  return new Map(rows.map((row) => [`${row.planId}:${row.taskId}`, row.data as LogData | null]));
}

async function writeCopy(
  userId: number,
  target: Target,
  data: LogData,
  existing: Map<string, LogData | null>,
  fromPlanId: string,
) {
  const key = `${target.plan.id}:${target.taskId}`;
  // The first row written for the day is the original. After that, each row
  // keeps its own original-or-copy status. `fromPlanId` must be the block that
  // holds the original, never a block that holds only a copy.
  const marker = existing.has(key) ? (existing.get(key) ?? {})[SYNC_MARKER] : fromPlanId;
  const next = marker === undefined ? data : { ...data, [SYNC_MARKER]: marker };
  await db
    .insert(taskCompletions)
    .values({
      userId,
      planId: target.plan.id,
      taskId: target.taskId,
      data: next,
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [taskCompletions.planId, taskCompletions.userId, taskCompletions.taskId],
      targetWhere: sql`plan_id IS NOT NULL`,
      // completedAt stays as it was, so an edit does not move the activity date.
      set: { data: next },
    });
}

/**
 * Copy a saved log to the other blocks. Edits replace the copy, so a changed or
 * extra entry (for example a second exercise) reaches every block.
 * Returns the ids of the blocks that changed, and the first block this copy
 * finished (if any), so the caller can celebrate it at once.
 */
export async function mirrorSharedLog(input: {
  userId: number;
  source: PlanSummary;
  task: LogTask;
  timezone: string;
}): Promise<{
  planIds: string[];
  finished?: { planId: string; blockNumber: number; earnedBadgeId?: string };
}> {
  const { userId, source, task, timezone } = input;
  const targets = await getSyncTargets(userId, source, task, timezone);
  if (targets.length === 0) return { planIds: [] };

  const [sourceRow] = await db
    .select({ data: taskCompletions.data })
    .from(taskCompletions)
    .where(
      and(
        eq(taskCompletions.userId, userId),
        eq(taskCompletions.planId, source.id),
        eq(taskCompletions.taskId, task.id),
      ),
    )
    .limit(1);
  if (!sourceRow) return { planIds: [] };
  const { [SYNC_MARKER]: sourceMarker, ...shared } = (sourceRow.data ?? {}) as LogData;
  // When the source is itself a copy, the new copies point to its original.
  const originPlanId = originOf(sourceMarker, source.id);

  const existing = await getExistingData(userId, targets);
  let finished: { planId: string; blockNumber: number; earnedBadgeId?: string } | undefined;
  for (const target of targets) {
    // A copy never points to its own block. That happens only when the original's row is gone.
    const from = originPlanId === target.plan.id ? source.id : originPlanId;
    await writeCopy(userId, target, shared, existing, from);
    const result = await finishPlanIfComplete(userId, target.plan);
    if (result.blockCompleted && !finished) {
      finished = {
        planId: target.plan.id,
        blockNumber: target.plan.blockNumber,
        ...(result.earnedBadgeId ? { earnedBadgeId: result.earnedBadgeId } : {}),
      };
    }
  }
  return { planIds: targets.map((target) => target.plan.id), ...(finished ? { finished } : {}) };
}

/** Remove today's matching log from the other blocks when it is removed from one. */
export async function removeSharedLog(input: {
  userId: number;
  source: PlanSummary;
  task: LogTask;
  timezone: string;
}): Promise<string[]> {
  const { userId, source, task, timezone } = input;
  const targets = await getSyncTargets(userId, source, task, timezone);
  for (const target of targets) {
    await db
      .delete(taskCompletions)
      .where(
        and(
          eq(taskCompletions.userId, userId),
          eq(taskCompletions.planId, target.plan.id),
          eq(taskCompletions.taskId, target.taskId),
        ),
      );
  }
  return targets.map((target) => target.plan.id);
}

/** When a member starts or joins a block mid-day, bring in what they already logged today. */
export async function copyTodaysLogsIntoPlan(input: {
  userId: number;
  plan: PlanSummary;
  timezone: string;
}) {
  const { userId, plan, timezone } = input;
  const others = await getOtherSharingPlans(userId, plan.id, timezone);
  for (const type of SHARED_TASK_TYPES) {
    const target = todaysTaskOfType(plan, type, timezone);
    if (!target) continue;
    const candidates = others.flatMap((other) => {
      const task = todaysTaskOfType(other, type, timezone);
      return task ? [{ planId: other.id, taskId: task.id }] : [];
    });
    if (candidates.length === 0) continue;
    const [latest] = await db
      .select({ planId: taskCompletions.planId, data: taskCompletions.data })
      .from(taskCompletions)
      .where(
        and(
          eq(taskCompletions.userId, userId),
          // Exact pairs: two plans of one block share task ids, on different days.
          or(
            ...candidates.map((c) =>
              and(eq(taskCompletions.planId, c.planId), eq(taskCompletions.taskId, c.taskId)),
            ),
          ),
        ),
      )
      .orderBy(desc(taskCompletions.completedAt))
      .limit(1);
    if (!latest?.planId) continue;
    const { [SYNC_MARKER]: latestMarker, ...shared } = (latest.data ?? {}) as LogData;
    const copyTarget = { plan, taskId: target.id };
    await writeCopy(
      userId,
      copyTarget,
      shared,
      await getExistingData(userId, [copyTarget]),
      originOf(latestMarker, latest.planId),
    );
  }
}

/**
 * Call this before a block's rows are deleted (plan deleted, or a member leaves).
 * Copies of that block's logs stay in the member's other blocks. This removes the
 * copy marker from one copy of each log (one for each date and type), so the log
 * stays in the feed and still counts on Home. Other copies of that log stay copies.
 */
export async function keepSharedLogsOfPlan(input: {
  planId: string;
  userIds?: number[];
  timezone: string;
}) {
  const { planId, userIds, timezone } = input;
  const copies = await db
    .select({
      id: taskCompletions.id,
      userId: taskCompletions.userId,
      taskId: taskCompletions.taskId,
      startedAt: plans.startedAt,
    })
    .from(taskCompletions)
    .innerJoin(plans, eq(taskCompletions.planId, plans.id))
    .where(
      and(
        sql`${taskCompletions.data}->>'syncedFromPlanId' = ${planId}`,
        ne(taskCompletions.planId, planId),
        userIds ? inArray(taskCompletions.userId, userIds) : undefined,
      ),
    );

  const keep = new Map<string, string>();
  for (const copy of copies) {
    const task = getTaskById(copy.taskId);
    if (!task) continue;
    // A copy on the block's current day is a "today" log, even when the block is
    // past 25 days and its Day 25 falls on an older date.
    const isTodayLog = task.day === getPlanCurrentDay(copy.startedAt, timezone);
    const date = getPlanDayDate(
      isTodayLog ? new Date() : copy.startedAt,
      isTodayLog ? 1 : task.day,
      timezone,
    )
      .toISOString()
      .slice(0, 10);
    const key = `${copy.userId}:${date}:${task.type}`;
    if (!keep.has(key)) keep.set(key, copy.id);
  }
  if (keep.size === 0) return;
  await db
    .update(taskCompletions)
    .set({ data: sql`${taskCompletions.data} - 'syncedFromPlanId'` })
    .where(inArray(taskCompletions.id, [...keep.values()]));
}
