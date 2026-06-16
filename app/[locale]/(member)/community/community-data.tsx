import { getLocale } from "next-intl/server";
import { getSessionUser } from "@/src/features/auth";
import {
  getFriendIds,
  getIncomingRequestIds,
  getSuggestionIds,
  getSentRequestIdsCached,
  getActivityFeedRows,
  getPublicProfilesByIds,
  getLikeCountsForCompletions,
  getUserLikedCompletionIds,
} from "@/src/features/community";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";
import { getLocalizedString } from "@/src/features/content";
import { CommunityClient } from "./community-client";
import {
  createExerciseFormatter,
  getExerciseEntries,
} from "@/src/features/community/exercise-format";

export async function CommunityData() {
  const user = await getSessionUser();
  if (!user) return null;

  const locale = await getLocale();
  const { restText, formatExerciseEntry } = await createExerciseFormatter(locale);

  const [friendIds, requestIds, suggestionIds, sentRequestIds, feedRows] = await Promise.all([
    getFriendIds(user.id),
    getIncomingRequestIds(user.id),
    getSuggestionIds(user.id),
    getSentRequestIdsCached(user.id),
    getActivityFeedRows(user.id),
  ]);

  const feedCompletionIds = feedRows.map((r) => r.completionId);
  const [likeCounts, likedIds] = await Promise.all([
    getLikeCountsForCompletions(feedCompletionIds),
    getUserLikedCompletionIds(user.id, feedCompletionIds),
  ]);

  const sentSet = new Set(sentRequestIds);

  const ids = new Set<number>();
  for (const f of friendIds) ids.add(f.id);
  for (const r of requestIds) ids.add(r.senderId);
  for (const s of suggestionIds) ids.add(s.id);
  for (const row of feedRows) ids.add(row.userId);

  // Single batched query instead of one-per-id (fan-out previously caused
  // N+1 storms against PlanetScale Postgres on cold cache / after updateTag).
  const profiles = await getPublicProfilesByIds([...ids]);

  return (
    <CommunityClient
      selfUserId={user.id}
      initialData={{
        friends: friendIds.map((f) => {
          const profile = profiles.get(f.id);
          return {
            id: f.id,
            displayName: profile?.displayName ?? null,
            searchHandle: profile?.searchHandle ?? null,
            avatarUrl: profile?.avatarUrl ?? null,
            lastActivity:
              f.lastActivityMs != null ? new Date(f.lastActivityMs).toISOString() : null,
          };
        }),
        requests: requestIds.map((r) => {
          const profile = profiles.get(r.senderId);
          return {
            requestId: r.requestId,
            userId: r.senderId,
            displayName: profile?.displayName ?? null,
            searchHandle: profile?.searchHandle ?? null,
            avatarUrl: profile?.avatarUrl ?? null,
            createdAt: new Date(r.createdAtMs).toISOString(),
          };
        }),
        suggestions: suggestionIds.map((s) => {
          const profile = profiles.get(s.id);
          return {
            id: s.id,
            displayName: profile?.displayName ?? null,
            searchHandle: profile?.searchHandle ?? null,
            avatarUrl: profile?.avatarUrl ?? null,
            mutualCount: s.mutualCount,
            connectionStatus: sentSet.has(s.id) ? ("sent" as const) : ("none" as const),
          };
        }),
        feed: feedRows.flatMap((row) => {
          const profile = profiles.get(row.userId);
          const base = {
            completionId: row.completionId,
            userId: row.userId,
            displayName: profile?.displayName ?? null,
            searchHandle: profile?.searchHandle ?? null,
            avatarUrl: profile?.avatarUrl ?? null,
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
        }),
      }}
    />
  );
}
