import { getSessionUser } from "@/src/features/auth";
import { db } from "@/src/db";
import { taskCompletions, blockDayTasks, memberBlockCompletions, badgeDefinitions, memberBadges } from "@/src/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { taskId, data } = body as { taskId: string; data?: Record<string, unknown> };

  if (!taskId) {
    return Response.json({ error: "taskId required" }, { status: 400 });
  }

  // Insert completion (ignore duplicates via unique constraint)
  try {
    await db.insert(taskCompletions).values({
      userId: user.id,
      taskId,
      data: data ?? {},
      completedAt: new Date(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    // Unique constraint violation — already completed
    if (message.includes("unique") || message.includes("duplicate") || message.includes("23505")) {
      return Response.json({ success: true, alreadyCompleted: true });
    }
    throw err;
  }

  // Check block completion: has user completed at least 1 task in each category?
  const categoryCheck = await db.execute(sql`
    SELECT COUNT(DISTINCT bdt.category)::int AS cat_count
    FROM task_completions tc
    JOIN block_day_tasks bdt ON tc.task_id = bdt.id
    WHERE tc.user_id = ${user.id}
      AND bdt.block_number = 1
  `);

  const catCount = Number((categoryCheck.rows[0] as { cat_count: number })?.cat_count ?? 0);

  let blockCompleted = false;
  if (catCount >= 3) {
    // Check if block completion already recorded
    const existing = await db
      .select()
      .from(memberBlockCompletions)
      .where(
        and(
          eq(memberBlockCompletions.userId, user.id),
          eq(memberBlockCompletions.blockNumber, 1)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(memberBlockCompletions).values({
        userId: user.id,
        blockNumber: 1,
      });

      // Award badge
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

  return Response.json({ success: true, blockCompleted });
}
