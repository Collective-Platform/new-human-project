"use server";

import { updateTag } from "next/cache";
import { getSessionUser } from "@/src/features/auth";
import { db } from "@/src/db";
import { taskCompletions, planCompletions } from "@/src/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";
import { getFriendIdsRaw } from "@/src/features/community/invalidation";
import { getPlanForMember } from "@/src/features/plans/queries";
import { finishPlanIfComplete } from "./plan-finish";
import { getRequestTimezone, mirrorSharedLog, removeSharedLog } from "./shared-logs";

export async function completeTask(input: {
  taskId: string;
  data?: Record<string, unknown>;
  planId?: string;
}): Promise<
  | {
      success: true;
      blockCompleted: boolean;
      completedBlockNumber?: number;
      completedPlanId?: string;
      earnedBadgeId?: string;
    }
  | { error: string }
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

  // One atomic upsert on the partial unique index, so two saves at the same
  // moment (double tap, quick mood/exercise entries) cannot collide.
  await db
    .insert(taskCompletions)
    .values({
      userId: user.id,
      planId,
      taskId,
      data: data ?? {},
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [taskCompletions.planId, taskCompletions.userId, taskCompletions.taskId],
      targetWhere: sql`plan_id IS NOT NULL`,
      set: {
        data: sql`COALESCE(${taskCompletions.data}, '{}') || ${JSON.stringify(data ?? {})}::jsonb`,
        // completedAt intentionally omitted — preserve the original timestamp
        // so notes updates don't bump the activity to the top of the feed.
      },
    });
  // Mood and exercise logged today also count in the member's other blocks.
  const mirrored = await mirrorSharedLog({
    userId: user.id,
    source: planState.plan,
    task,
    timezone: await getRequestTimezone(),
  });
  const syncedPlanIds = mirrored.planIds;
  const own = await finishPlanIfComplete(user.id, planState.plan);
  // A copied log can finish another block. Celebrate it now if this block did not finish.
  const celebrated = own.blockCompleted
    ? { ...own, planId, blockNumber: planState.plan.blockNumber }
    : mirrored.finished;
  const blockCompleted = celebrated !== undefined;
  const earnedBadgeId = celebrated?.earnedBadgeId;

  const friendIds = await getFriendIdsRaw(user.id);
  updateTag(`dashboard:${user.id}`);
  updateTag(`feed:${user.id}`);
  for (const fid of friendIds) updateTag(`feed:${fid}`);
  updateTag(`plan:${planId}`);
  updateTag(`plans:${user.id}`);
  for (const syncedId of syncedPlanIds) updateTag(`plan:${syncedId}`);
  return {
    success: true,
    blockCompleted,
    ...(celebrated
      ? { completedBlockNumber: celebrated.blockNumber, completedPlanId: celebrated.planId }
      : {}),
    ...(earnedBadgeId ? { earnedBadgeId } : {}),
  };
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

  const planState = await getPlanForMember(planId, user.id);
  if (!planState) {
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

  const task = getRegistryTaskById(taskId);
  const syncedPlanIds = task
    ? await removeSharedLog({
        userId: user.id,
        source: planState.plan,
        task,
        timezone: await getRequestTimezone(),
      })
    : [];

  const friendIds = await getFriendIdsRaw(user.id);
  updateTag(`dashboard:${user.id}`);
  updateTag(`progress:${user.id}`);
  updateTag(`feed:${user.id}`);
  for (const fid of friendIds) updateTag(`feed:${fid}`);
  if (planId) updateTag(`plan:${planId}`);
  for (const syncedId of syncedPlanIds) updateTag(`plan:${syncedId}`);

  return { success: true };
}

export async function redoBlock(
  _blockNumber: number,
): Promise<{ success: true } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };
  return { error: "Start a new plan to repeat a block." };
}
