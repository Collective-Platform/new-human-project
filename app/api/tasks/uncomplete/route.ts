import { getSessionUser } from "@/src/features/auth";
import { db } from "@/src/db";
import { taskCompletions } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { taskId } = body as { taskId: string };

  if (!taskId) {
    return Response.json({ error: "taskId required" }, { status: 400 });
  }

  await db
    .delete(taskCompletions)
    .where(
      and(
        eq(taskCompletions.userId, user.id),
        eq(taskCompletions.taskId, taskId),
      ),
    );

  return Response.json({ success: true });
}
