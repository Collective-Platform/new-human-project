"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toggleLike } from "@/src/features/community/actions";
import { Link, useRouter } from "@/src/i18n/navigation";
import { User, Settings, QrCode } from "lucide-react";
import NextImage from "next/image";
import type { ProfileData } from "@/src/features/profile/get-profile-for-user";
import { ActivityFeed, type FeedItem } from "../community/activity-feed";
// import { BadgeGrid } from "./badge-grid";
import { ShareProfileModal } from "./share-profile-modal";

export function ProfileClient({
  initialData,
  friendCount,
  activities,
  selfUserId,
}: {
  initialData: ProfileData;
  friendCount: number;
  activities: FeedItem[];
  selfUserId: number;
}) {
  const t = useTranslations("profile");
  const router = useRouter();
  const { user } = initialData;
  const [shareOpen, setShareOpen] = useState(false);
  const [likeState, setLikeState] = useState<
    Map<string, { liked: boolean; count: number }>
  >(
    () =>
      new Map(
        activities.map((a) => [
          a.completionId,
          { liked: a.likedByMe, count: a.likeCount },
        ]),
      ),
  );

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

  function handleItemClick(taskId: string, date: string) {
    router.push(`/progress?date=${date}&task=${taskId}`);
  }

  return (
    <div className="min-h-screen bg-surface antialiased">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 pt-8 pb-8">
        {/* Profile header */}
        <section className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-4">
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
                {user.searchHandle ? `@${user.searchHandle}` : t("username")}
              </h2>
              <div className="flex items-center gap-2">
                <Link
                  href="/community/friends"
                  className="inline-flex items-center gap-1.5 px-3 py-1 border border-outline-variant rounded-full text-on-surface-variant hover:bg-surface-container hover:border-primary/30 hover:text-primary transition-all active:scale-95"
                >
                  <User size={14} />
                  <span className="text-sm font-bold font-headline">
                    {friendCount} Friends
                  </span>
                </Link>
                {user.searchHandle && (
                  <button
                    onClick={() => setShareOpen(true)}
                    aria-label="Share profile"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all active:scale-95"
                  >
                    <QrCode size={16} />
                  </button>
                )}
                <Link
                  href="/profile/settings"
                  aria-label="Settings"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all active:scale-95"
                >
                  <Settings size={16} />
                </Link>
              </div>
            </div>

            {/* Avatar (display only) */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface shadow-xl flex items-center justify-center">
                {user.avatarUrl ? (
                  <NextImage
                    src={user.avatarUrl}
                    alt={user.displayName ?? ""}
                    width={96}
                    height={96}
                    unoptimized
                    className="rounded-full object-cover"
                    style={{ width: 96, height: 96 }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-surface-container-highest flex items-center justify-center">
                    <User size={38} className="text-on-surface-variant" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Badges */}
        {/* {initialData.badges.length > 0 && (
          <section className="mb-8">
            <BadgeGrid badges={initialData.badges} title={t("badges")} />
          </section>
        )} */}

        {/* Activities */}
        {activities.length > 0 && (
          <section className="mb-8">
            <h3 className="font-headline text-xl font-bold text-on-surface mb-4 px-1">
              Activities
            </h3>
            <ActivityFeed
              items={activities}
              selfUserId={selfUserId}
              onLikeAction={handleLike}
              onItemClickAction={handleItemClick}
              likeOverrides={likeState}
              allowSelfLike
            />
          </section>
        )}
      </main>

      {user.searchHandle && (
        <ShareProfileModal
          handle={user.searchHandle}
          isOpen={shareOpen}
          onCloseAction={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
