"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { getSessionUser } from "@/src/features/auth";
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
import { BLOCK_LAUNCH, BLOCK_LENGTH_DAYS, getActiveBlock } from "@/src/lib/program-gate";

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
  const { blockNumber } = getActiveBlock(user.onboardedAt ?? BLOCK_LAUNCH[1], new Date(), timezone);

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
