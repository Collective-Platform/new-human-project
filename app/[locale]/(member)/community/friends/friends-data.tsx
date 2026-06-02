import { getSessionUser } from "@/src/features/auth";
import { getFriendIds, getPublicProfilesByIds } from "@/src/features/community";
import { FriendsListClient } from "./friends-list-client";

export async function FriendsData() {
  const user = await getSessionUser();
  if (!user) return null;

  const friendIds = await getFriendIds(user.id);

  // Single batched query instead of one-per-id to avoid N+1 storms.
  const profiles = await getPublicProfilesByIds(friendIds.map((f) => f.id));

  const friends = friendIds.map((f) => {
    const profile = profiles.get(f.id);
    return {
      id: f.id,
      displayName: profile?.displayName ?? null,
      searchHandle: profile?.searchHandle ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      lastActivity: f.lastActivityMs != null ? new Date(f.lastActivityMs).toISOString() : null,
    };
  });

  return <FriendsListClient friends={friends} />;
}
