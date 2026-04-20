import { getSessionUser } from "@/src/features/auth";
import { getCurrentDay } from "@/src/features/dashboard";
import { getDayTasks, getUserCompletions, getDayCompletionStates } from "@/src/features/progress";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user?.onboardedAt) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const currentDay = getCurrentDay(user.onboardedAt);
  const requestedDay = Math.min(
    Math.max(Number(url.searchParams.get("day")) || currentDay, 1),
    currentDay
  );

  const blockNumber = 1;
  const tasks = await getDayTasks(blockNumber, requestedDay);
  const taskIds = tasks.map((t) => t.id);
  const completedSet = await getUserCompletions(user.id, taskIds);

  // Get completion states for all days (for carousel)
  const dayStates = await getDayCompletionStates(user.id, blockNumber);
  const carousel = Array.from({ length: 25 }, (_, i) => {
    const day = i + 1;
    return {
      day,
      reachable: day <= currentDay,
      hasCompletion: dayStates.has(day),
    };
  });

  return Response.json({
    currentDay,
    selectedDay: requestedDay,
    carousel,
    tasks: tasks.map((t) => ({
      id: t.id,
      category: t.category,
      taskType: t.taskType,
      name: t.name,
      content: t.content,
      completed: completedSet.has(t.id),
    })),
  });
}
