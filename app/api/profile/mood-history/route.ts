import { getSessionUser } from "@/src/features/auth";
import { db } from "@/src/db";
import { taskCompletions, blockDayTasks } from "@/src/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await db
    .select({
      completedAt: taskCompletions.completedAt,
      data: taskCompletions.data,
    })
    .from(taskCompletions)
    .innerJoin(blockDayTasks, eq(taskCompletions.taskId, blockDayTasks.id))
    .where(
      and(
        eq(taskCompletions.userId, user.id),
        eq(blockDayTasks.taskType, "mood_log")
      )
    )
    .orderBy(desc(taskCompletions.completedAt))
    .limit(100);

  return Response.json({
    entries: entries.map((e) => ({
      completedAt: e.completedAt.toISOString(),
      data: e.data,
    })),
  });
}
