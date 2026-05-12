import { getSessionUser } from "@/src/features/auth";
import {
  getFriendIds,
  getIncomingRequestIds,
  getSuggestionIds,
  getActivityFeedRows,
  getPublicProfile,
} from "@/src/features/community";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";
import { getLocalizedString } from "@/src/features/content";
import { CommunityClient } from "./community-client";

export async function CommunityData() {
  const user = await getSessionUser();
  if (!user) return null;

  const [friendIds, requestIds, suggestionIds, feedRows] = await Promise.all([
    getFriendIds(user.id),
    getIncomingRequestIds(user.id),
    getSuggestionIds(user.id),
    getActivityFeedRows(user.id),
  ]);

  const ids = new Set<number>();
  for (const f of friendIds) ids.add(f.id);
  for (const r of requestIds) ids.add(r.senderId);
  for (const s of suggestionIds) ids.add(s.id);
  for (const row of feedRows) ids.add(row.userId);

  const profileEntries = await Promise.all(
    [...ids].map(async (id) => [id, await getPublicProfile(id)] as const),
  );
  const profiles = new Map(profileEntries);

  return (
    <CommunityClient
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
          };
        }),
        feed: feedRows.flatMap((row) => {
          const task = getRegistryTaskById(row.taskId);
          if (!task) return [];
          const profile = profiles.get(row.userId);
          return [
            {
              displayName: profile?.displayName ?? null,
              searchHandle: profile?.searchHandle ?? null,
              avatarUrl: profile?.avatarUrl ?? null,
              category: task.category,
              activity: getLocalizedString(task.name, "en"),
              completedAt: new Date(row.completedAtMs).toISOString(),
            },
          ];
        }),
      }}
    />
  );
}
