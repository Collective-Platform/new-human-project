import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { getSessionUser } from "@/src/features/auth";
import { getBlockOverviewForUser } from "@/src/features/progress";
import { getActiveBlock } from "@/src/lib/program-gate";
import { getProfileForUser } from "@/src/features/profile/get-profile-for-user";
import {
  getFriendIds,
  getUserActivitiesCached,
  getLikeCountsForCompletions,
  getUserLikedCompletionIds,
} from "@/src/features/community";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";
import { getLocalizedString } from "@/src/features/content";
import { ProfileClient } from "./profile-client";
import type { FeedItem } from "../community/activity-feed";
import {
  createExerciseFormatter,
  getExerciseEntries,
} from "@/src/features/community/exercise-format";

export async function ProfileData({ initialTab }: { initialTab: "activities" | "completed" }) {
  const user = await getSessionUser();
  if (!user) return null;

  const locale = await getLocale();
  const { restText, formatExerciseEntry } = await createExerciseFormatter(locale);

  const cookieStore = await cookies();
  const timezone = decodeURIComponent(cookieStore.get("tz")?.value ?? "UTC");
  const { currentDay, effectiveStart } = user.onboardedAt
    ? getActiveBlock(user.onboardedAt, new Date(), timezone)
    : { currentDay: 1, effectiveStart: new Date() };

  const [initialData, friendIds, activityRows, blockOverview] = await Promise.all([
    getProfileForUser(user.id),
    getFriendIds(user.id),
    getUserActivitiesCached(user.id, user.id),
    user.onboardedAt
      ? getBlockOverviewForUser(user.id, effectiveStart.getTime(), currentDay, timezone)
      : null,
  ]);
  if (!initialData) return null;

  const activityCompletionIds = activityRows.map((r) => r.completionId);
  const [likeCounts, likedIds] = await Promise.all([
    getLikeCountsForCompletions(activityCompletionIds),
    getUserLikedCompletionIds(user.id, activityCompletionIds),
  ]);

  const activities: FeedItem[] = activityRows.flatMap((row) => {
    const base = {
      completionId: row.completionId,
      taskId: row.taskId,
      userId: user.id,
      displayName: initialData.user.displayName,
      searchHandle: initialData.user.searchHandle,
      avatarUrl: initialData.user.avatarUrl,
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

  return (
    <ProfileClient
      initialData={initialData}
      friendCount={friendIds.length}
      activities={activities}
      selfUserId={user.id}
      completedBlocks={blockOverview?.completedBlocks ?? []}
      initialTab={initialTab}
    />
  );
}
