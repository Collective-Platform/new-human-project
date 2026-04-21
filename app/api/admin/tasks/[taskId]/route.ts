import { getSessionUser, isAdmin } from "@/src/features/auth";
import { db } from "@/src/db";
import { blockDayTasks } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const user = await getSessionUser();
  if (!user || !isAdmin(user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { taskId } = await params;
  const body = await request.json();
  const { content } = body as { content: Record<string, unknown> };

  if (!content || typeof content !== "object") {
    return Response.json({ error: "content required" }, { status: 400 });
  }

  const rows = await db
    .update(blockDayTasks)
    .set({ content, updatedAt: new Date() })
    .where(eq(blockDayTasks.id, taskId))
    .returning();

  if (rows.length === 0) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
