import { revalidateTag } from "next/cache";
import { getSessionUser } from "@/src/features/auth";
import { db } from "@/src/db";
import {
  blockDayTasks,
  taskCompletions,
  memberBlockCompletions,
  badgeDefinitions,
  memberBadges,
} from "@/src/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { taskId, data } = body as {
    taskId: string;
    data?: Record<string, unknown>;
  };

  if (!taskId) {
    return Response.json({ error: "taskId required" }, { status: 400 });
  }

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
        // Merge incoming fields into the existing JSONB rather than
        // overwriting, so concurrent autosaves (practice + reflection) don't
        // race and clobber each other.
        data: sql`COALESCE(${taskCompletions.data}, '{}') || ${JSON.stringify(data ?? {})}::jsonb`,
        completedAt: new Date(),
      },
    });

  // Block completion check: ≥ 3 categories completed in block 1.
  //
  // The legacy SQL JOINed `task_completions.task_id` against
  // `block_day_tasks.id` to look up a category. Now that some tasks live
  // in the markdown registry (no DB row), we resolve the category in
  // application code: load the user's completions, then look up each id
  // in the registry first and the DB second.
  const completions = await db
    .select({ taskId: taskCompletions.taskId })
    .from(taskCompletions)
    .where(eq(taskCompletions.userId, user.id));

  const dbTasks = await db
    .select({ id: blockDayTasks.id, category: blockDayTasks.category })
    .from(blockDayTasks)
    .where(eq(blockDayTasks.blockNumber, 1));
  const dbCategoryById = new Map(dbTasks.map((t) => [t.id, t.category]));

  const completedCategories = new Set<string>();
  for (const c of completions) {
    const fromRegistry = getRegistryTaskById(c.taskId);
    if (fromRegistry && fromRegistry.block === 1) {
      completedCategories.add(fromRegistry.category);
      continue;
    }
    const fromDb = dbCategoryById.get(c.taskId);
    if (fromDb) completedCategories.add(fromDb);
  }

  let blockCompleted = false;
  if (completedCategories.size >= 3) {
    // Check if block completion already recorded
    const existing = await db
      .select()
      .from(memberBlockCompletions)
      .where(
        and(
          eq(memberBlockCompletions.userId, user.id),
          eq(memberBlockCompletions.blockNumber, 1),
        ),
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

  revalidateTag("progress", { expire: 0 });

  return Response.json({ success: true, blockCompleted });
}
