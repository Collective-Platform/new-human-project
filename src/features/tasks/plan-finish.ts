import { and, eq } from "drizzle-orm";
import { db } from "@/src/db";
import { badgeDefinitions, memberBadges, planCompletions, taskCompletions } from "@/src/db/schema";
import { getDayTasks } from "@/src/features/content/program";
import { BLOCK_LENGTH_DAYS } from "@/src/lib/program-gate";

/**
 * Marks a plan as finished for a member when every task of every day is done.
 * Returns the badge the member just earned, if any.
 */
export async function finishPlanIfComplete(
  userId: number,
  plan: { id: string; blockNumber: number },
): Promise<{ blockCompleted: boolean; earnedBadgeId?: string }> {
  const rows = await db
    .select({ taskId: taskCompletions.taskId })
    .from(taskCompletions)
    .where(and(eq(taskCompletions.userId, userId), eq(taskCompletions.planId, plan.id)));
  const completedTaskIds = new Set(rows.map((row) => row.taskId));
  const allTasksComplete = Array.from({ length: BLOCK_LENGTH_DAYS }, (_, index) => index + 1).every(
    (day) => getDayTasks(plan.blockNumber, day).every((item) => completedTaskIds.has(item.id)),
  );
  if (!allTasksComplete) return { blockCompleted: false };

  // Two saves of the last task can arrive at once. Only the one that adds the row celebrates.
  const [completion] = await db
    .insert(planCompletions)
    .values({ planId: plan.id, userId })
    .onConflictDoNothing()
    .returning();
  if (!completion) return { blockCompleted: false };

  let earnedBadgeId: string | undefined;
  const badge = await db
    .select({ id: badgeDefinitions.id })
    .from(badgeDefinitions)
    .where(eq(badgeDefinitions.blockNumber, plan.blockNumber))
    .limit(1);
  if (badge[0]) {
    const [earnedBadge] = await db
      .insert(memberBadges)
      .values({ userId, badgeId: badge[0].id, planId: plan.id })
      .onConflictDoNothing()
      .returning();
    earnedBadgeId = earnedBadge?.id;
  }
  return { blockCompleted: true, ...(earnedBadgeId ? { earnedBadgeId } : {}) };
}
