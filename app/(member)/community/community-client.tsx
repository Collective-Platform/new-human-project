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
  searchHandle: string | null;
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
  searchHandle: string | null;
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
    <div className="max-w-2xl mx-auto px-6 pt-6 pb-8">
      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setTab("friends")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-headline font-semibold transition-colors ${
            tab === "friends"
              ? "bg-on-surface text-surface border border-on-surface"
              : "border border-outline-variant text-on-surface hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-xl">group</span>
          <span>{t("friends")}</span>
        </button>
        <button
          onClick={() => setTab("add")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-headline font-semibold transition-colors ${
            tab === "add"
              ? "bg-on-surface text-surface border border-on-surface"
              : "border border-outline-variant text-on-surface hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-xl">person_add</span>
          <span>{t("addFriends")}</span>
        </button>
      </div>

      {!data && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {data && tab === "friends" && (
        <div className="space-y-4">
          {/* Incoming friend requests */}
          {data.requests.length > 0 && (
            <FriendRequests requests={data.requests} onUpdate={fetchData} />
          )}

          {/* People You May Know carousel */}
          {data.suggestions.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-bold mb-4 font-headline text-on-surface">
                {t("peopleYouMayKnow")}
              </h2>
              <PeopleYouMayKnow
                suggestions={data.suggestions}
                onAdd={fetchData}
              />
            </section>
          )}

          {/* Friends list */}
          <FriendsList friends={data.friends} />

          {/* Activity Feed */}
          <ActivityFeed items={data.feed} />
        </div>
      )}

      {data && tab === "add" && <AddFriends onRequestSent={fetchData} />}
    </div>
  );
}
