"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toggleLike } from "@/src/features/community/actions";
import { Link, useRouter } from "@/src/i18n/navigation";
import { User, Settings, QrCode, ChevronRight, CheckCircle2 } from "lucide-react";
import NextImage from "next/image";
import type { ProfileData } from "@/src/features/profile/get-profile-for-user";
import type { BlockOverviewData } from "@/src/features/progress";
import { ActivityFeed, type FeedItem } from "../community/activity-feed";
import { StreakBadge } from "../dashboard/streak-badge";
import { BadgeGrid } from "./badge-grid";
import { ShareProfileModal } from "./share-profile-modal";

export function ProfileClient({
  initialData,
  friendCount,
  activities,
  selfUserId,
  completedBlocks,
  initialTab,
}: {
  initialData: ProfileData;
  friendCount: number;
  activities: FeedItem[];
  selfUserId: number;
  completedBlocks: BlockOverviewData["completedBlocks"];
  initialTab: "activities" | "completed";
}) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const router = useRouter();
  const { user } = initialData;
  const [shareOpen, setShareOpen] = useState(false);
  const [tab, setTab] = useState<"activities" | "completed">(initialTab);
  const hasCompleted = completedBlocks.length > 0;
  const [likeState, setLikeState] = useState<Map<string, { liked: boolean; count: number }>>(
    () =>
      new Map(activities.map((a) => [a.completionId, { liked: a.likedByMe, count: a.likeCount }])),
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
                  <span className="text-sm font-bold font-headline">{friendCount} Friends</span>
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
        {initialData.badges.length > 0 && (
          <section className="mb-8">
            <BadgeGrid badges={initialData.badges} title={t("badges")} />
          </section>
        )}

        {/* Activities / Completed blocks */}
        {(activities.length > 0 || hasCompleted) && (
          <section className="mb-8">
            <div className="inline-flex items-center gap-0.5 rounded-full bg-surface-container-high p-0.5 mb-4">
              <button
                type="button"
                onClick={() => setTab("activities")}
                className={`rounded-full px-3 py-1 text-center text-xs font-medium transition-all ${
                  tab === "activities"
                    ? "bg-primary text-on-primary"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {t("tabActivities")}
              </button>
              <button
                type="button"
                onClick={() => setTab("completed")}
                disabled={!hasCompleted}
                className={`rounded-full px-3 py-1 text-center text-xs font-medium transition-all disabled:opacity-40 ${
                  tab === "completed"
                    ? "bg-primary text-on-primary"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {t("tabCompleted")}
              </button>
            </div>

            {tab === "activities" ? (
              <ActivityFeed
                items={activities}
                selfUserId={selfUserId}
                onLikeAction={handleLike}
                onItemClickAction={handleItemClick}
                likeOverrides={likeState}
                allowSelfLike
              />
            ) : (
              <div className="flex flex-col gap-3">
                {completedBlocks.map((block) => (
                  <button
                    key={block.blockNumber}
                    onClick={() =>
                      router.push(`/profile?block=${block.blockNumber}&view=completed`)
                    }
                    className="w-full text-left rounded-2xl border border-outline/30 bg-surface px-5 py-4 flex items-center gap-4 hover:bg-outline/5 active:scale-[0.99] transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-foreground">
                          {locale === "zh"
                            ? `第${block.blockNumber}周期`
                            : `Block ${block.blockNumber}`}
                        </p>
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        {block.finalStreak > 0 ? (
                          <StreakBadge count={block.finalStreak} size="sm" />
                        ) : (
                          <p className="text-[13px] font-medium text-primary">
                            {locale === "zh" ? "查看记录" : "View logs"}
                          </p>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] text-foreground/60">
                        {locale === "zh" ? "完成：" : "Completed: "}
                        {new Date(block.completedAt).toLocaleDateString(
                          locale === "zh" ? "zh-CN" : "en-US",
                          { year: "numeric", month: "short", day: "numeric" },
                        )}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-outline shrink-0" />
                  </button>
                ))}
              </div>
            )}
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
