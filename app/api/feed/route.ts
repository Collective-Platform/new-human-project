import { type NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/src/features/auth";
import { getActivityFeedPaged } from "@/src/features/community/queries";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";
import { getLocalizedString } from "@/src/features/content";

const PAGE_SIZE = 10;

function formatDuration(hours: number, minutes: number): string {
  if (hours === 0 && minutes === 0) return "";
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

const sportLabels: Record<string, string> = {
  badminton: "Badminton",
  run: "Run",
  pickleball: "Pickleball",
  swimming: "Swimming",
  pilates: "Pilates",
};

function getExerciseActivityLabel(data: Record<string, unknown> | null): string {
  if (!data) return "Exercise";
  const sportKey = data.sportKey as string | undefined;
  if (!sportKey) return "Exercise";
  if (sportKey === "rest") return "Rest";
  if (sportKey === "others") return (data.customSport as string | undefined) ?? "Exercise";
  return sportLabels[sportKey] ?? "Exercise";
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;

  const rows = await getActivityFeedPaged(user.id, { limit: PAGE_SIZE, cursor });

  const items = rows.flatMap((row) => {
    const base = {
      userId: row.userId,
      displayName: row.displayName,
      searchHandle: row.searchHandle,
      avatarUrl: row.avatarUrl,
      completedAt: new Date(row.completedAtMs).toISOString(),
    };

    const registryTask = getRegistryTaskById(row.taskId);
    if (registryTask) {
      if (registryTask.type === "exercise") {
        const sport = getExerciseActivityLabel(row.completionData);
        const h = (row.completionData?.hours as number | undefined) ?? 0;
        const m = (row.completionData?.minutes as number | undefined) ?? 0;
        const dur = formatDuration(h, m);
        return [
          {
            ...base,
            category: registryTask.category,
            activity: dur ? `${sport} for ${dur}` : sport,
          },
        ];
      }
      return [
        {
          ...base,
          category: registryTask.category,
          activity: getLocalizedString(registryTask.name, "en"),
        },
      ];
    }

    if (row.dbTaskType === "exercise") {
      const sport = getExerciseActivityLabel(row.completionData);
      const h = (row.completionData?.hours as number | undefined) ?? 0;
      const m = (row.completionData?.minutes as number | undefined) ?? 0;
      const dur = formatDuration(h, m);
      return [
        {
          ...base,
          category: row.dbCategory ?? "Physical",
          activity: dur ? `${sport} for ${dur}` : sport,
        },
      ];
    }

    return [];
  });

  // nextCursor is based on the last DB row so we page through all rows even if some are filtered
  const nextCursor =
    rows.length === PAGE_SIZE ? new Date(rows[rows.length - 1].completedAtMs).toISOString() : null;

  return NextResponse.json({ items, nextCursor });
}
