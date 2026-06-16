import { type NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/src/features/auth";
import {
  getActivityFeedPaged,
  getLikeCountsForCompletions,
  getUserLikedCompletionIds,
} from "@/src/features/community/queries";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";
import { getLocalizedString } from "@/src/features/content";
import {
  createExerciseFormatter,
  getExerciseEntries,
} from "@/src/features/community/exercise-format";

const PAGE_SIZE = 10;

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
  const locale = request.nextUrl.searchParams.get("locale") ?? "en";
  const { restText, formatExerciseEntry } = await createExerciseFormatter(locale);

  const rows = await getActivityFeedPaged(user.id, { limit: PAGE_SIZE, cursor });

  const completionIds = rows.map((r) => r.completionId);
  const [likeCounts, likedIds] = await Promise.all([
    getLikeCountsForCompletions(completionIds),
    getUserLikedCompletionIds(user.id, completionIds),
  ]);

  const items = rows.flatMap((row) => {
    const base = {
      completionId: row.completionId,
      userId: row.userId,
      displayName: row.displayName,
      searchHandle: row.searchHandle,
      avatarUrl: row.avatarUrl,
      completedAt: new Date(row.completedAtMs).toISOString(),
      likeCount: likeCounts[row.completionId] ?? 0,
      likedByMe: likedIds.has(row.completionId),
    };

    const registryTask = getRegistryTaskById(row.taskId);
    if (registryTask) {
      if (registryTask.type === "exercise") {
        const entries = getExerciseEntries(row.completionData ?? null);
        const nonRest = entries.filter((e) => (e.sportKey as string) !== "rest");
        if (nonRest.length === 0) {
          return [{ ...base, category: registryTask.category, activity: restText }];
        }
        return nonRest.map((entry, i) => ({
          ...base,
          id: `${row.completionId}:${i}`,
          category: registryTask.category,
          activity: formatExerciseEntry(entry),
        }));
      }
      return [
        {
          ...base,
          category: registryTask.category,
          activity: getLocalizedString(registryTask.name, locale),
        },
      ];
    }

    if (row.dbTaskType === "exercise") {
      const entries = getExerciseEntries(row.completionData ?? null);
      const nonRest = entries.filter((e) => (e.sportKey as string) !== "rest");
      if (nonRest.length === 0) {
        return [{ ...base, category: row.dbCategory ?? "Physical", activity: restText }];
      }
      return nonRest.map((entry, i) => ({
        ...base,
        id: `${row.completionId}:${i}`,
        category: row.dbCategory ?? "Physical",
        activity: formatExerciseEntry(entry),
      }));
    }

    return [];
  });

  // nextCursor is based on the last DB row so we page through all rows even if some are filtered
  const nextCursor =
    rows.length === PAGE_SIZE ? new Date(rows[rows.length - 1].completedAtMs).toISOString() : null;

  return NextResponse.json({ items, nextCursor });
}
