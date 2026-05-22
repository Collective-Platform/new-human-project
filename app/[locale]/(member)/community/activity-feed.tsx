"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { BookOpenText, Smile, SportShoe, CheckCircle, User, Heart, X, type LucideIcon } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { getActivityLikers } from "@/src/features/community/actions";

export interface FeedItem {
  completionId: string;
  taskId?: string;
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

const categoryStyles: Record<
  string,
  {
    badgeBg: string;
    badgeText: string;
    iconBg: string;
    accentText: string;
    Icon: LucideIcon;
  }
> = {
  Mental: {
    badgeBg: "bg-primary-container",
    badgeText: "text-on-primary-container",
    iconBg: "bg-primary",
    accentText: "text-primary",
    Icon: BookOpenText,
  },
  Emotional: {
    badgeBg: "bg-secondary-container",
    badgeText: "text-on-secondary-container",
    iconBg: "bg-secondary",
    accentText: "text-secondary",
    Icon: Smile,
  },
  Physical: {
    badgeBg: "bg-tertiary-container",
    badgeText: "text-on-tertiary-fixed-variant",
    iconBg: "bg-tertiary",
    accentText: "text-tertiary",
    Icon: SportShoe,
  },
};

const defaultStyle = {
  badgeBg: "bg-surface-container",
  badgeText: "text-on-surface-variant",
  iconBg: "bg-on-surface",
  accentText: "text-on-surface",
  Icon: CheckCircle,
};

type TFn = ReturnType<typeof useTranslations>;

type Liker = {
  id: number;
  displayName: string | null;
  searchHandle: string | null;
  avatarUrl: string | null;
};

function relativeTime(dateStr: string, t: TFn): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return t("justNow");
  if (minutes < 60) return t("minutesAgo", { minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("hoursAgo", { hours });
  const days = Math.floor(hours / 24);
  return t("daysAgo", { days });
}

function ActivityCard({
  item,
  selfUserId,
  onLikeAction,
  onItemClickAction,
  likeInfo,
  allowSelfLike,
  t,
  tProgress,
}: {
  item: FeedItem;
  selfUserId?: number;
  onLikeAction?: (completionId: string) => void;
  onItemClickAction?: (taskId: string, date: string) => void;
  likeInfo: { liked: boolean; count: number };
  allowSelfLike?: boolean;
  t: TFn;
  tProgress: TFn;
}) {
  const lastTapRef = useRef(0);
  const [likersOpen, setLikersOpen] = useState(false);
  const [likers, setLikers] = useState<Liker[] | null>(null);

  const isSelf = selfUserId !== undefined && item.userId === selfUserId;
  const style = categoryStyles[item.category] ?? defaultStyle;
  const CategoryIcon = style.Icon;
  const name = item.searchHandle ? `@${item.searchHandle}` : "User";
  const href = `/community/${item.searchHandle ?? item.userId}`;

  const categoryLabels: Record<string, string> = {
    Mental: tProgress("mental"),
    Emotional: tProgress("emotional"),
    Physical: tProgress("physical"),
  };

  function handleTap() {
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < 300;
    lastTapRef.current = isDoubleTap ? 0 : now;

    if (isDoubleTap && (!isSelf || allowSelfLike) && onLikeAction) {
      onLikeAction(item.completionId);
      return;
    }

    if (!isDoubleTap && onItemClickAction && item.taskId) {
      onItemClickAction(item.taskId, item.completedAt.split('T')[0]);
    }
  }

  async function handleCountClick(e: React.MouseEvent) {
    e.stopPropagation();
    setLikersOpen(true);
    if (likers === null) {
      const result = await getActivityLikers({ completionId: item.completionId });
      if (!("error" in result)) setLikers(result.likers);
    }
  }

  const avatarNode = (
    <>
      {item.avatarUrl ? (
        <Image
          src={item.avatarUrl}
          alt={name}
          width={56}
          height={56}
          unoptimized
          className="w-14 h-14 rounded-full object-cover"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center">
          <User size={24} className="text-on-surface-variant" />
        </div>
      )}
      <div
        className={`absolute -bottom-1 -right-1 ${style.iconBg} p-1.5 rounded-full border-4 border-white`}
      >
        <CategoryIcon size={12} className="text-white" />
      </div>
    </>
  );

  return (
    <>
      <div
        onClick={handleTap}
        className="group bg-white p-5 rounded-2xl flex items-center gap-4 transition-all hover:shadow-card"
      >
        {isSelf ? (
          <div className="relative shrink-0">{avatarNode}</div>
        ) : (
          <Link href={href} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            {avatarNode}
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <p className="text-on-surface text-sm">
              {isSelf ? (
                <span className="font-medium">{t("you")}</span>
              ) : (
                <Link href={href} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                  {name}
                </Link>
              )}{" "}
              <span className="text-on-surface-variant">{t("completedActivity")}</span>{" "}
              <span className={`font-medium ${style.accentText}`}>{item.activity}</span>
            </p>
            <span className="text-[10px] font-normal text-outline uppercase tracking-tighter shrink-0 ml-2">
              {relativeTime(item.completedAt, t)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span
              className={`px-3 py-1 ${style.badgeBg} rounded-full text-[10px] font-bold ${style.badgeText} uppercase tracking-widest`}
            >
              {categoryLabels[item.category] ?? item.category}
            </span>
            <div className="flex items-center gap-1.5">
              {(!isSelf || allowSelfLike) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLikeAction?.(item.completionId);
                  }}
                  className="flex items-center text-outline hover:text-primary transition-colors"
                >
                  <Heart
                    size={14}
                    className={likeInfo.liked ? "fill-primary text-primary" : ""}
                  />
                </button>
              )}
              {likeInfo.count > 0 && (
                <button
                  onClick={handleCountClick}
                  className="text-xs text-outline hover:text-primary transition-colors"
                >
                  {likeInfo.count}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {likersOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setLikersOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-surface rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="font-headline font-bold text-lg text-on-surface">
                {likeInfo.count} {likeInfo.count === 1 ? "Like" : "Likes"}
              </h3>
              <button
                onClick={() => setLikersOpen(false)}
                className="text-outline hover:text-on-surface transition-colors active:scale-95"
              >
                <X size={20} />
              </button>
            </div>
            {likers === null ? (
              <div className="flex justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : likers.length === 0 ? (
              <div className="px-5 pb-6 text-sm text-on-surface-variant text-center">No likes yet</div>
            ) : (
              <div className="overflow-y-auto max-h-80 px-4 pb-5 space-y-3">
                {likers.map((liker) => {
                  const likerName = liker.searchHandle ? `@${liker.searchHandle}` : "User";
                  return (
                    <Link
                      key={liker.id}
                      href={`/community/${liker.searchHandle ?? liker.id}`}
                      onClick={() => setLikersOpen(false)}
                      className="flex items-center gap-3"
                    >
                      {liker.avatarUrl ? (
                        <Image
                          src={liker.avatarUrl}
                          alt={likerName}
                          width={40}
                          height={40}
                          unoptimized
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                          <User size={16} className="text-on-surface-variant" />
                        </div>
                      )}
                      <span className="flex-1 truncate font-headline font-medium text-sm text-on-surface">
                        {likerName}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function ActivityFeed({
  items,
  selfUserId,
  onLikeAction,
  onItemClickAction,
  likeOverrides,
  allowSelfLike,
}: {
  items: FeedItem[];
  selfUserId?: number;
  onLikeAction?: (completionId: string) => void;
  onItemClickAction?: (taskId: string, date: string) => void;
  likeOverrides?: Map<string, { liked: boolean; count: number }>;
  allowSelfLike?: boolean;
}) {
  const t = useTranslations("community");
  const tProgress = useTranslations("progress");

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const likeInfo = likeOverrides?.get(item.completionId) ?? {
          liked: item.likedByMe,
          count: item.likeCount,
        };
        return (
          <ActivityCard
            key={item.completionId}
            item={item}
            selfUserId={selfUserId}
            onLikeAction={onLikeAction}
            onItemClickAction={onItemClickAction}
            likeInfo={likeInfo}
            allowSelfLike={allowSelfLike}
            t={t}
            tProgress={tProgress}
          />
        );
      })}
    </div>
  );
}
