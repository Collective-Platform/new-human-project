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
    25
  );

  const blockNumber = 1;
  const tasks = await getDayTasks(blockNumber, requestedDay);
  const taskIds = tasks.map((t) => t.id);
  const completedMap = await getUserCompletions(user.id, taskIds);

  // Get completion states for all days (for carousel)
  const dayStates = await getDayCompletionStates(user.id, blockNumber);
  const carousel = Array.from({ length: 25 }, (_, i) => {
    const day = i + 1;
    return {
      day,
      reachable: true,
      hasCompletion: dayStates.has(day),
    };
  });

  // Count missed days: past days (before currentDay) with no completions
  let missedDays = 0;
  for (let d = 1; d < currentDay; d++) {
    if (!dayStates.has(d)) missedDays++;
  }

  return Response.json({
    currentDay,
    selectedDay: requestedDay,
    blockStartDate: user.onboardedAt.toISOString(),
    missedDays,
    carousel,
    tasks: tasks.map((t) => ({
      id: t.id,
      category: t.category,
      taskType: t.taskType,
      name: t.name,
      content: t.content,
      completed: completedMap.has(t.id),
      completionData: completedMap.get(t.id) ?? null,
    })),
  });
}
