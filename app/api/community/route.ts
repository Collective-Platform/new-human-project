import { getSessionUser } from "@/src/features/auth";
import {
  getFriends,
  getIncomingRequests,
  getPeopleYouMayKnow,
  getActivityFeed,
} from "@/src/features/community";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [friends, requests, suggestions, feed] = await Promise.all([
    getFriends(user.id),
    getIncomingRequests(user.id),
    getPeopleYouMayKnow(user.id),
    getActivityFeed(user.id),
  ]);

  return Response.json({
    friends: friends.map((f) => ({
      id: f.id,
      displayName: f.display_name,
      searchHandle: f.search_handle,
      avatarUrl: f.avatar_url,
      lastActivity: f.last_activity,
    })),
    requests: requests.map((r) => ({
      requestId: r.request_id,
      userId: r.user_id,
      displayName: r.display_name,
      searchHandle: r.search_handle,
      avatarUrl: r.avatar_url,
      createdAt: r.created_at,
    })),
    suggestions: suggestions.map((s) => ({
      id: s.id,
      displayName: s.display_name,
      searchHandle: s.search_handle,
      avatarUrl: s.avatar_url,
      mutualCount: Number(s.mutual_count),
    })),
    feed: feed.map((f) => ({
      displayName: f.display_name,
      searchHandle: f.search_handle,
      avatarUrl: f.avatar_url,
      category: f.category,
      activity: f.activity,
      completedAt: f.completed_at,
    })),
  });
}
