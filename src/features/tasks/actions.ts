"use server";

import { updateTag } from "next/cache";
import { getSessionUser } from "@/src/features/auth";
import { isProgramLocked } from "@/src/lib/program-gate";
import { db } from "@/src/db";
import {
  taskCompletions,
  memberBlockCompletions,
  badgeDefinitions,
  memberBadges,
} from "@/src/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";
import { getFriendIdsRaw } from "@/src/features/community/invalidation";

export async function completeTask(input: {
  taskId: string;
  data?: Record<string, unknown>;
}): Promise<{ success: true; blockCompleted: boolean } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };
  if (isProgramLocked()) return { error: "Program hasn't started yet" };

  const { taskId, data } = input;
  if (!taskId) return { error: "taskId required" };

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
    if (task && task.block === 1) {
      const cats = dayCategories.get(task.day) ?? new Set<string>();
      cats.add(task.category);
      dayCategories.set(task.day, cats);
    }
  }

  const allDaysComplete = Array.from({ length: 25 }, (_, i) => i + 1)
    .every((day) => (dayCategories.get(day)?.size ?? 0) >= 3);

  let blockCompleted = false;
  if (allDaysComplete) {
    const existing = await db
      .select()
      .from(memberBlockCompletions)
      .where(
        and(eq(memberBlockCompletions.userId, user.id), eq(memberBlockCompletions.blockNumber, 1)),
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(memberBlockCompletions).values({
        userId: user.id,
        blockNumber: 1,
      });

      const badge = await db
        .select()
        .from(badgeDefinitions)
        .where(eq(badgeDefinitions.blockNumber, 1))
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

export async function uncompleteTask(input: {
  taskId: string;
}): Promise<{ success: true } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };
  if (isProgramLocked()) return { error: "Program hasn't started yet" };

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
