"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { getSessionUser } from "@/src/features/auth";
import { db } from "@/src/db";
import {
  taskCompletions,
  memberBlockCompletions,
  memberBlockAttempts,
  badgeDefinitions,
  memberBadges,
} from "@/src/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import {
  getTaskById as getRegistryTaskById,
  getDayTasks,
  getMaxContentBlock,
} from "@/src/features/content/program";
import { getActiveBlockForUser, fetchAttempts } from "@/src/features/progress/block-attempts";
import { getFriendIdsRaw } from "@/src/features/community/invalidation";
import {
  BLOCK_LENGTH_DAYS,
  getActiveBlock,
  getBlockStart,
  getLocalDateMarker,
} from "@/src/lib/program-gate";

export async function completeTask(input: {
  taskId: string;
  data?: Record<string, unknown>;
}): Promise<{ success: true; blockCompleted: boolean } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const { taskId, data } = input;
  if (!taskId) return { error: "taskId required" };

  const cookieStore = await cookies();
  const timezone = decodeURIComponent(cookieStore.get("tz")?.value ?? "UTC");
  const { blockNumber } = await getActiveBlockForUser(user, new Date(), timezone);

  await db
    .insert(taskCompletions)
    .values({
      userId: user.id,
      taskId,
      data: data ?? {},
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [taskCompletions.userId, taskCompletions.taskId],
      set: {
        data: sql`COALESCE(${taskCompletions.data}, '{}') || ${JSON.stringify(data ?? {})}::jsonb`,
        // completedAt intentionally omitted — preserve the original timestamp
        // so notes updates don't bump the activity to the top of the feed.
      },
    });

  const completions = await db
    .select({ taskId: taskCompletions.taskId })
    .from(taskCompletions)
    .where(eq(taskCompletions.userId, user.id));

  const dayCategories = new Map<number, Set<string>>();
  for (const c of completions) {
    const task = getRegistryTaskById(c.taskId);
    if (task && task.block === blockNumber) {
      const cats = dayCategories.get(task.day) ?? new Set<string>();
      cats.add(task.category);
      dayCategories.set(task.day, cats);
    }
  }

  const allDaysComplete = Array.from({ length: BLOCK_LENGTH_DAYS }, (_, i) => i + 1).every(
    (day) => (dayCategories.get(day)?.size ?? 0) >= 3,
  );

  let blockCompleted = false;
  if (allDaysComplete) {
    const existing = await db
      .select()
      .from(memberBlockCompletions)
      .where(
        and(
          eq(memberBlockCompletions.userId, user.id),
          eq(memberBlockCompletions.blockNumber, blockNumber),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(memberBlockCompletions).values({
        userId: user.id,
        blockNumber,
      });

      const badge = await db
        .select()
        .from(badgeDefinitions)
        .where(eq(badgeDefinitions.blockNumber, blockNumber))
        .limit(1);

      if (badge.length > 0) {
        try {
          await db.insert(memberBadges).values({
            userId: user.id,
            badgeId: badge[0].id,
          });
        } catch {
          // Badge already awarded
        }
      }

      blockCompleted = true;
    }
  }

  const friendIds = await getFriendIdsRaw(user.id);
  updateTag(`dashboard:${user.id}`);
  updateTag(`progress:${user.id}`);
  updateTag(`feed:${user.id}`);
  for (const fid of friendIds) updateTag(`feed:${fid}`);

  return { success: true, blockCompleted };
}

/**
 * "Complete block" button. Marks the active block's attempt completed and opens the
 * next block today. Only allowed once that block has content and has launched. Gives no badge — that still needs all 25 days done
 * (see `completeTask`).
 */
export async function completeBlock(): Promise<{ success: true } | { error: string }> {
  const user = await getSessionUser();
  if (!user?.onboardedAt) return { error: "Unauthorized" };

  const cookieStore = await cookies();
  const timezone = decodeURIComponent(cookieStore.get("tz")?.value ?? "UTC");
  const now = new Date();

  // Fresh read (not the per-request cache) so a double tap sees the first write.
  const attempts = await fetchAttempts(user.id);
  const active = getActiveBlock(user.onboardedAt, attempts, now, timezone, getMaxContentBlock());
  if (active.state !== "can-complete") return { error: "Block cannot be completed yet" };

  const { blockNumber } = active;
  const nextBlockNumber = blockNumber + 1;
  const startsOn = (d: Date) => d.toISOString().slice(0, 10);

  await db.transaction(async (tx) => {
    // Block 1 has no row until now (derived from onboarding). Create it so it can be closed.
    await tx
      .insert(memberBlockAttempts)
      .values({
        userId: user.id,
        blockNumber,
        attempt: 1,
        startsOn: startsOn(getBlockStart(user.onboardedAt!, attempts, blockNumber, timezone)),
      })
      .onConflictDoNothing();

    await tx
      .update(memberBlockAttempts)
      .set({ completedAt: now })
      .where(
        and(
          eq(memberBlockAttempts.userId, user.id),
          eq(memberBlockAttempts.blockNumber, blockNumber),
          eq(memberBlockAttempts.attempt, 1),
          sql`${memberBlockAttempts.completedAt} IS NULL`,
        ),
      );

    {
      await tx
        .insert(memberBlockAttempts)
        .values({
          userId: user.id,
          blockNumber: nextBlockNumber,
          attempt: 1,
          startsOn: startsOn(getLocalDateMarker(now, timezone)),
        })
        .onConflictDoNothing();
    }
  });

  updateTag(`dashboard:${user.id}`);
  updateTag(`progress:${user.id}`);

  return { success: true };
}

export async function uncompleteTask(input: {
  taskId: string;
}): Promise<{ success: true } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const { taskId } = input;
  if (!taskId) return { error: "taskId required" };

  await db
    .delete(taskCompletions)
    .where(and(eq(taskCompletions.userId, user.id), eq(taskCompletions.taskId, taskId)));

  const friendIds = await getFriendIdsRaw(user.id);
  updateTag(`dashboard:${user.id}`);
  updateTag(`progress:${user.id}`);
  updateTag(`feed:${user.id}`);
  for (const fid of friendIds) updateTag(`feed:${fid}`);

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
  blockNumber: number,
): Promise<{ success: true } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  // Collect all task IDs for this block from the registry
  const taskIds: string[] = [];
  for (let day = 1; day <= BLOCK_LENGTH_DAYS; day++) {
    for (const task of getDayTasks(blockNumber, day)) {
      taskIds.push(task.id);
    }
  }

  if (taskIds.length > 0) {
    await db
      .delete(taskCompletions)
      .where(and(eq(taskCompletions.userId, user.id), inArray(taskCompletions.taskId, taskIds)));
  }

  await db
    .delete(memberBlockCompletions)
    .where(
      and(
        eq(memberBlockCompletions.userId, user.id),
        eq(memberBlockCompletions.blockNumber, blockNumber),
      ),
    );

  const badge = await db
    .select({ id: badgeDefinitions.id })
    .from(badgeDefinitions)
    .where(eq(badgeDefinitions.blockNumber, blockNumber))
    .limit(1);

  if (badge.length > 0) {
    await db
      .delete(memberBadges)
      .where(and(eq(memberBadges.userId, user.id), eq(memberBadges.badgeId, badge[0].id)));
  }

  const friendIds = await getFriendIdsRaw(user.id);
  updateTag(`dashboard:${user.id}`);
  updateTag(`progress:${user.id}`);
  updateTag(`feed:${user.id}`);
  for (const fid of friendIds) updateTag(`feed:${fid}`);

  return { success: true };
}
