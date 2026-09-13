"use server";

import { updateTag } from "next/cache";
import { getSessionUser } from "@/src/features/auth";
import { db } from "@/src/db";
import {
  taskCompletions,
  planCompletions,
  badgeDefinitions,
  memberBadges,
  users,
} from "@/src/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getTaskById as getRegistryTaskById, getDayTasks } from "@/src/features/content/program";
import { getFriendIdsRaw } from "@/src/features/community/invalidation";
import { BLOCK_LENGTH_DAYS } from "@/src/lib/program-gate";
import { getPlanForMember } from "@/src/features/plans/queries";

export async function completeTask(input: {
  taskId: string;
  data?: Record<string, unknown>;
  planId?: string;
}): Promise<
  { success: true; blockCompleted: boolean; earnedBadgeId?: string } | { error: string }
> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const { taskId, data, planId } = input;
  if (!taskId) return { error: "taskId required" };
  if (!planId) return { error: "Choose a plan before completing tasks." };

  const planState = await getPlanForMember(planId, user.id);
  const task = getRegistryTaskById(taskId);
  if (!planState || !task || task.block !== planState.plan.blockNumber) {
    return { error: "This task is not available in your plan." };
  }

  const existing = await db
    .select({ id: taskCompletions.id })
    .from(taskCompletions)
    .where(
      and(
        eq(taskCompletions.userId, user.id),
        eq(taskCompletions.taskId, taskId),
        eq(taskCompletions.planId, planId),
      ),
    )
    .limit(1);
  if (existing[0]) {
    await db
      .update(taskCompletions)
      .set({
        data: sql`COALESCE(${taskCompletions.data}, '{}') || ${JSON.stringify(data ?? {})}::jsonb`,
      })
      .where(eq(taskCompletions.id, existing[0].id));
  } else {
    await db.insert(taskCompletions).values({
      userId: user.id,
      planId,
      taskId,
      data: data ?? {},
      completedAt: new Date(),
    });
  }
  const planCompletionsForUser = await db
    .select({ taskId: taskCompletions.taskId })
    .from(taskCompletions)
    .where(and(eq(taskCompletions.userId, user.id), eq(taskCompletions.planId, planId)));
  const completedTaskIds = new Set(planCompletionsForUser.map((row) => row.taskId));
  const allTasksComplete = Array.from({ length: BLOCK_LENGTH_DAYS }, (_, index) => index + 1).every(
    (day) =>
      getDayTasks(planState.plan.blockNumber, day).every((item) => completedTaskIds.has(item.id)),
  );

  let blockCompleted = false;
  let earnedBadgeId: string | undefined;
  if (allTasksComplete) {
    const existingPlanCompletion = await db
      .select({ id: planCompletions.id })
      .from(planCompletions)
      .where(and(eq(planCompletions.planId, planId), eq(planCompletions.userId, user.id)))
      .limit(1);
    if (!existingPlanCompletion[0]) {
      await db.insert(planCompletions).values({ planId, userId: user.id });
      const badge = await db
        .select({ id: badgeDefinitions.id })
        .from(badgeDefinitions)
        .where(eq(badgeDefinitions.blockNumber, planState.plan.blockNumber))
        .limit(1);
      if (badge[0]) {
        const [earnedBadge] = await db
          .insert(memberBadges)
          .values({ userId: user.id, badgeId: badge[0].id, planId })
          .onConflictDoNothing()
          .returning();
        earnedBadgeId = earnedBadge?.id;
      }
      await db
        .update(users)
        .set({ dashboardPlanId: null, updatedAt: new Date() })
        .where(and(eq(users.id, user.id), eq(users.dashboardPlanId, planId)));
      blockCompleted = true;
    }
  }

  const friendIds = await getFriendIdsRaw(user.id);
  updateTag(`dashboard:${user.id}`);
  updateTag(`feed:${user.id}`);
  for (const fid of friendIds) updateTag(`feed:${fid}`);
  updateTag(`plan:${planId}`);
  updateTag(`plans:${user.id}`);
  return { success: true, blockCompleted, ...(earnedBadgeId ? { earnedBadgeId } : {}) };
}

export async function uncompleteTask(input: {
  taskId: string;
  planId?: string;
}): Promise<{ success: true } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const { taskId, planId } = input;
  if (!taskId) return { error: "taskId required" };
  if (!planId) return { error: "Choose a plan before changing tasks." };

  if (!(await getPlanForMember(planId, user.id))) {
    return { error: "This plan is unavailable." };
  }
  const completedPlan = await db
    .select({ id: planCompletions.id })
    .from(planCompletions)
    .where(and(eq(planCompletions.planId, planId), eq(planCompletions.userId, user.id)))
    .limit(1);
  if (completedPlan[0]) return { error: "Completed plans cannot be changed." };

  await db
    .delete(taskCompletions)
    .where(
      and(
        eq(taskCompletions.userId, user.id),
        eq(taskCompletions.taskId, taskId),
        eq(taskCompletions.planId, planId),
      ),
    );

  const friendIds = await getFriendIdsRaw(user.id);
  updateTag(`dashboard:${user.id}`);
  updateTag(`progress:${user.id}`);
  updateTag(`feed:${user.id}`);
  for (const fid of friendIds) updateTag(`feed:${fid}`);
  if (planId) updateTag(`plan:${planId}`);

  return { success: true };
}

/**
 * Upsert data for a task in a completed block.
 *
 * - On first save (task never individually completed): inserts a new row so the
 *   task becomes visible as completed on next load.
 * - On subsequent saves: merges the data field only — `completedAt` is never
 *   updated, so the block's streak remains frozen even after content edits.
 *
 * Does NOT recheck block-completion (the block is already done).
 */
export async function updateCompletedTaskData(input: {
  taskId: string;
  data: Record<string, unknown>;
  blockEndDate?: string;
}): Promise<{ success: true; isNew: boolean } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const { taskId, data, blockEndDate } = input;
  if (!taskId) return { error: "taskId required" };

  const existing = await db
    .select({ id: taskCompletions.id })
    .from(taskCompletions)
    .where(and(eq(taskCompletions.userId, user.id), eq(taskCompletions.taskId, taskId)))
    .limit(1);

  const isNew = existing.length === 0;
  // For skipped tasks completed while revisiting a finished block, stamp with the
  // block's end date so the completion doesn't affect the current streak or feed.
  const completedAt = isNew && blockEndDate ? new Date(blockEndDate) : new Date();

  await db
    .insert(taskCompletions)
    .values({
      userId: user.id,
      taskId,
      data,
      completedAt,
    })
    .onConflictDoUpdate({
      target: [taskCompletions.userId, taskCompletions.taskId],
      set: {
        data: sql`COALESCE(${taskCompletions.data}, '{}') || ${JSON.stringify(data)}::jsonb`,
        // completedAt intentionally omitted — streak is frozen for completed blocks
      },
    });

  const friendIds = await getFriendIdsRaw(user.id);
  updateTag(`dashboard:${user.id}`);
  updateTag(`progress:${user.id}`);
  updateTag(`feed:${user.id}`);
  for (const fid of friendIds) updateTag(`feed:${fid}`);

  return { success: true, isNew };
}

export async function redoBlock(
  _blockNumber: number,
): Promise<{ success: true } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };
  return { error: "Start a new plan to repeat a block." };
}
