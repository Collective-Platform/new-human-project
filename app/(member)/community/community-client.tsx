"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FriendsList } from "./friends-list";
import { AddFriends } from "./add-friends";
import { FriendRequests } from "./friend-requests";
import { PeopleYouMayKnow } from "./people-you-may-know";
import { ActivityFeed } from "./activity-feed";

interface Friend {
  id: number;
  displayName: string | null;
  avatarUrl: string | null;
  lastActivity: string | null;
}

interface FriendRequest {
  requestId: string;
  userId: number;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

interface Suggestion {
  id: number;
  displayName: string | null;
  avatarUrl: string | null;
  mutualCount: number;
}

interface FeedItem {
  displayName: string | null;
  avatarUrl: string | null;
  category: string;
  activity: string;
  completedAt: string;
}

interface CommunityData {
  friends: Friend[];
  requests: FriendRequest[];
  suggestions: Suggestion[];
  feed: FeedItem[];
}

export function CommunityClient() {
  const t = useTranslations("community");
  const [tab, setTab] = useState<"friends" | "add">("friends");
  const [data, setData] = useState<CommunityData | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/community");
    if (res.ok) {
      setData(await res.json());
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      {/* Toggle buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("friends")}
          className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
            tab === "friends"
              ? "bg-primary text-white"
              : "bg-zinc-100 text-foreground/60"
          }`}
        >
          {t("friends")}
        </button>
        <button
          onClick={() => setTab("add")}
          className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
            tab === "add"
              ? "bg-primary text-white"
              : "bg-zinc-100 text-foreground/60"
          }`}
        >
          {t("addFriends")}
        </button>
      </div>

      {!data && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {data && tab === "friends" && (
        <>
          {/* Incoming friend requests */}
          {data.requests.length > 0 && (
            <FriendRequests requests={data.requests} onUpdate={fetchData} />
          )}

          {/* People You May Know carousel */}
          {data.suggestions.length > 0 && (
            <PeopleYouMayKnow
              suggestions={data.suggestions}
              onAdd={fetchData}
            />
          )}

          {/* Friends list */}
          <FriendsList friends={data.friends} />

          {/* Activity Feed */}
          <ActivityFeed items={data.feed} />
        </>
      )}

      {data && tab === "add" && <AddFriends onRequestSent={fetchData} />}
    </div>
  );
}
