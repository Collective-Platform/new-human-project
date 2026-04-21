import { getSessionUser, isAdmin } from "@/src/features/auth";
import { db } from "@/src/db";
import { blockDayTasks } from "@/src/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !isAdmin(user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const tasks = await db
    .select({
      id: blockDayTasks.id,
      blockNumber: blockDayTasks.blockNumber,
      dayNumber: blockDayTasks.dayNumber,
      category: blockDayTasks.category,
      taskType: blockDayTasks.taskType,
      name: blockDayTasks.name,
      content: blockDayTasks.content,
      displayOrder: blockDayTasks.displayOrder,
      updatedAt: blockDayTasks.updatedAt,
    })
    .from(blockDayTasks)
    .where(eq(blockDayTasks.blockNumber, 1))
    .orderBy(asc(blockDayTasks.dayNumber), asc(blockDayTasks.displayOrder));

  return Response.json({ tasks });
}
