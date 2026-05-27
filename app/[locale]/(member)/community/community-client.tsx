"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Users, UserPlus, X } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { AddFriends } from "./add-friends";
import { FriendRequests } from "./friend-requests";
import { PeopleYouMayKnow } from "./people-you-may-know";
import { ActivityFeed } from "./activity-feed";
import { toggleLike } from "@/src/features/community/actions";

interface Friend {
  id: number;
  displayName: string | null;
  searchHandle: string | null;
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
  searchHandle: string | null;
  avatarUrl: string | null;
  mutualCount: number;
  connectionStatus: "sent" | "none";
}

interface FeedItem {
  completionId: string;
  userId: number;
  displayName: string | null;
  searchHandle: string | null;
  avatarUrl: string | null;
  category: string;
  activity: string;
  completedAt: string;
  likeCount: number;
  likedByMe: boolean;
}

interface CommunityData {
  friends: Friend[];
  requests: FriendRequest[];
  suggestions: Suggestion[];
  feed: FeedItem[];
}

export function CommunityClient({
  initialData,
  selfUserId,
}: {
  initialData: CommunityData;
  selfUserId: number;
}) {
  const router = useRouter();
  const t = useTranslations("community");
  const locale = useLocale();
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Feed state
  const [feedItems, setFeedItems] = useState<FeedItem[]>(initialData.feed);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<string | null>(
    initialData.feed.length > 0
      ? initialData.feed[initialData.feed.length - 1].completedAt
      : null,
  );
  const hasMoreRef = useRef(initialData.feed.length >= 10);
  const isLoadingRef = useRef(false);

  // Like state — tracks optimistic like counts and liked status per completionId
  const [likeState, setLikeState] = useState<
    Map<string, { liked: boolean; count: number }>
  >(
    () =>
      new Map(
        initialData.feed.map((item) => [
          item.completionId,
          { liked: item.likedByMe, count: item.likeCount },
        ]),
      ),
  );

  // Sync feed when server data refreshes (e.g. after accepting a friend request)
  useEffect(() => {
    setFeedItems(initialData.feed);
    cursorRef.current =
      initialData.feed.length > 0
        ? initialData.feed[initialData.feed.length - 1].completedAt
        : null;
    hasMoreRef.current = initialData.feed.length >= 10;
    setLikeState((prev) => {
      const next = new Map(prev);
      for (const item of initialData.feed) {
        next.set(item.completionId, {
          liked: item.likedByMe,
          count: item.likeCount,
        });
      }
      return next;
    });
  }, [initialData.feed]);

  const loadMore = useCallback(async () => {
    if (!cursorRef.current || isLoadingRef.current || !hasMoreRef.current)
      return;
    isLoadingRef.current = true;
    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/feed?cursor=${encodeURIComponent(cursorRef.current)}&locale=${locale}`,
      );
      if (!res.ok) return;
      const data: { items: FeedItem[]; nextCursor: string | null } =
        await res.json();
      setFeedItems((prev) => [...prev, ...data.items]);
      setLikeState((prev) => {
        const next = new Map(prev);
        for (const item of data.items) {
          if (!next.has(item.completionId)) {
            next.set(item.completionId, {
              liked: item.likedByMe,
              count: item.likeCount,
            });
          }
        }
        return next;
      });
      if (data.nextCursor) {
        cursorRef.current = data.nextCursor;
        hasMoreRef.current = true;
      } else {
        hasMoreRef.current = false;
      }
    } finally {
      isLoadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [locale]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  async function handleLike(completionId: string) {
    const snapshot = likeState.get(completionId) ?? { liked: false, count: 0 };
    setLikeState((prev) => {
      const current = prev.get(completionId) ?? { liked: false, count: 0 };
      return new Map(prev).set(completionId, {
        liked: !current.liked,
        count: current.count + (current.liked ? -1 : 1),
      });
    });
    const result = await toggleLike({ completionId });
    if ("error" in result) {
      setLikeState((prev) => new Map(prev).set(completionId, snapshot));
    }
  }

  function fetchData() {
    router.refresh();
  }

  if (searching) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-6 pb-8">
        <AddFriends
          onRequestSent={fetchData}
          onCancel={() => setSearching(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3 pt-6 pb-8">
      {/* Friends link + Add Friend button */}
      <div className="flex items-center justify-between gap-2 mb-6">
        <Link
          href="/community/friends"
          className="flex items-center w-full gap-2 justify-center px-4 py-2.5 bg-white rounded-2xl shadow-[0_4px_12px_rgba(53,50,47,0.03)] hover:shadow-card transition-all"
        >
          <Users size={18} className="text-primary" />
          <span className="font-headline font-medium text-on-surface">
            {t("friendsCount", { count: initialData.friends.length })}
          </span>
        </Link>
        <button
          onClick={() => setSearching(true)}
          className="flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-white rounded-2xl shadow-[0_4px_12px_rgba(53,50,47,0.03)] font-headline font-bold text-on-surface hover:shadow-card transition-all"
        >
          <UserPlus size={18} className="text-primary" />
          <span>{t("addFriend")}</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Incoming friend requests */}
        {initialData.requests.length > 0 && (
          <FriendRequests
            requests={initialData.requests}
            onUpdate={fetchData}
          />
        )}

        {/* People You May Know carousel */}
        {initialData.suggestions.length > 0 && showSuggestions && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium font-headline text-on-surface">
                {t("peopleYouMayKnow")}
              </h2>
              <button
                onClick={() => setShowSuggestions(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
                aria-label={t("dismissSuggestions")}
              >
                <X size={16} />
              </button>
            </div>
            <PeopleYouMayKnow
              suggestions={initialData.suggestions}
              onAddAction={fetchData}
            />
          </section>
        )}

        {/* Activity Feed */}
        <ActivityFeed
          items={feedItems}
          selfUserId={selfUserId}
          onLikeAction={handleLike}
          likeOverrides={likeState}
        />

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="flex justify-center py-2">
          {isLoadingMore && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>
      </div>
    </div>
  );
}
