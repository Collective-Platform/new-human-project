import { getLocale } from "next-intl/server";
import { getSessionUser } from "@/src/features/auth";
import {
  getPublicProfile,
  getPublicProfilesByIds,
  getPublicProfileByHandleCached,
  getFriendIds,
  getUserActivitiesCached,
  getSentRequestIdsCached,
  getLikeCountsForCompletions,
  getUserLikedCompletionIds,
} from "@/src/features/community";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";
import { getLocalizedString } from "@/src/features/content";
import { ProfileClient } from "./profile-client";
import {
  createExerciseFormatter,
  getExerciseEntries,
} from "@/src/features/community/exercise-format";

export async function ProfileData({ handle }: { handle: string }) {
  const user = await getSessionUser();
  if (!user) return null;

  const locale = await getLocale();
  const { restText, formatExerciseEntry } = await createExerciseFormatter(locale);

  const isNumericId = /^\d+$/.test(handle);
  const profile = await (isNumericId
    ? getPublicProfile(Number(handle))
    : getPublicProfileByHandleCached(handle));

  if (!profile) return null;

  const targetUserId = profile.id;

  const [activityRows, friendIds, viewerFriendIds, sentRequestIds] = await Promise.all([
    getUserActivitiesCached(user.id, targetUserId),
    getFriendIds(targetUserId),
    getFriendIds(user.id),
    getSentRequestIdsCached(user.id),
  ]);

  const activityCompletionIds = activityRows.map((r) => r.completionId);
  const [likeCounts, likedIds] = await Promise.all([
    getLikeCountsForCompletions(activityCompletionIds),
    getUserLikedCompletionIds(user.id, activityCompletionIds),
  ]);

  const viewerFriendSet = new Set(viewerFriendIds.map((f) => f.id));
  const sentSet = new Set(sentRequestIds);

  const connectionStatus: "friends" | "sent" | "none" = viewerFriendSet.has(targetUserId)
    ? "friends"
    : sentSet.has(targetUserId)
      ? "sent"
      : "none";

  // Single batched query instead of one-per-id to avoid N+1 storms.
  const profileMap = await getPublicProfilesByIds(friendIds.map((f) => f.id));

  const activities = activityRows.flatMap((row) => {
    const registryTask = getRegistryTaskById(row.taskId);
    const base = {
      completionId: row.completionId,
      userId: profile.id,
      displayName: profile.displayName,
      searchHandle: profile.searchHandle,
      avatarUrl: profile.avatarUrl,
      completedAt: new Date(row.completedAtMs).toISOString(),
      likeCount: likeCounts[row.completionId] ?? 0,
      likedByMe: likedIds.has(row.completionId),
    };

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

  const selfEntry = friendIds.find((f) => f.id === user.id);
  const otherFriends = friendIds
    .filter((f) => f.id !== user.id)
    .map((f) => {
      const p = profileMap.get(f.id);
      const friendStatus: "friends" | "sent" | "none" = viewerFriendSet.has(f.id)
        ? "friends"
        : sentSet.has(f.id)
          ? "sent"
          : "none";
      return {
        id: f.id,
        displayName: p?.displayName ?? null,
        searchHandle: p?.searchHandle ?? null,
        avatarUrl: p?.avatarUrl ?? null,
        connectionStatus: friendStatus,
      };
    });

  const selfProfile = selfEntry ? profileMap.get(selfEntry.id) : null;
  const friends = [
    ...(selfEntry
      ? [
          {
            id: user.id,
            displayName: selfProfile?.displayName ?? null,
            searchHandle: selfProfile?.searchHandle ?? null,
            avatarUrl: selfProfile?.avatarUrl ?? null,
            connectionStatus: "self" as const,
          },
        ]
      : []),
    ...otherFriends,
  ];

  const isPrivate = connectionStatus !== "friends";

  return (
    <ProfileClient
      profile={profile}
      activities={isPrivate ? [] : activities}
      friends={isPrivate ? [] : friends}
      connectionStatus={connectionStatus}
      selfUserId={user.id}
    />
  );
}
