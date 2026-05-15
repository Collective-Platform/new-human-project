import { getSessionUser } from "@/src/features/auth";
import { getFriendIds, getPublicProfile } from "@/src/features/community";
import { FriendsListClient } from "./friends-list-client";

export async function FriendsData() {
  const user = await getSessionUser();
  if (!user) return null;

  const friendIds = await getFriendIds(user.id);

  const profiles = await Promise.all(friendIds.map((f) => getPublicProfile(f.id)));

  const friends = friendIds.map((f, i) => {
    const profile = profiles[i];
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
