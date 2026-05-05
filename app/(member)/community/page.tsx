import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";
import {
  getActivityFeed,
  getFriends,
  getIncomingRequests,
  getPeopleYouMayKnow,
} from "@/src/features/community";
import { CommunityClient } from "./community-client";

function serializeDate(value: unknown) {
  return value instanceof Date ? value.toISOString() : String(value);
}

function serializeNullableDate(value: unknown) {
  if (!value) return null;
  return serializeDate(value);
}

export default async function CommunityPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [friends, requests, suggestions, feed] = await Promise.all([
    getFriends(user.id),
    getIncomingRequests(user.id),
    getPeopleYouMayKnow(user.id),
    getActivityFeed(user.id),
  ]);

  return (
    <CommunityClient
      initialData={{
        friends: friends.map((friend) => ({
          id: friend.id,
          displayName: friend.display_name,
          searchHandle: friend.search_handle,
          avatarUrl: friend.avatar_url,
          lastActivity: serializeNullableDate(friend.last_activity),
        })),
        requests: requests.map((request) => ({
          requestId: request.request_id,
          userId: request.user_id,
          displayName: request.display_name,
          searchHandle: request.search_handle,
          avatarUrl: request.avatar_url,
          createdAt: serializeDate(request.created_at),
        })),
        suggestions: suggestions.map((suggestion) => ({
          id: suggestion.id,
          displayName: suggestion.display_name,
          searchHandle: suggestion.search_handle,
          avatarUrl: suggestion.avatar_url,
          mutualCount: Number(suggestion.mutual_count),
        })),
        feed: feed.map((item) => ({
          displayName: item.display_name,
          searchHandle: item.search_handle,
          avatarUrl: item.avatar_url,
          category: item.category,
          activity: item.activity,
          completedAt: serializeDate(item.completed_at),
        })),
      }}
    />
  );
}
