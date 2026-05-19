"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { BookOpenText, Smile, SportShoe, CheckCircle, User, type LucideIcon } from "lucide-react";
import { Link } from "@/src/i18n/navigation";

export interface FeedItem {
  userId: number;
  displayName: string | null;
  searchHandle: string | null;
  avatarUrl: string | null;
  category: string;
  activity: string;
  completedAt: string;
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

export function ActivityFeed({ items, selfUserId }: { items: FeedItem[]; selfUserId?: number }) {
  const t = useTranslations("community");
  const tProgress = useTranslations("progress");

  const categoryLabels: Record<string, string> = {
    Mental: tProgress("mental"),
    Emotional: tProgress("emotional"),
    Physical: tProgress("physical"),
  };

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => {
        const style = categoryStyles[item.category] ?? defaultStyle;
        const CategoryIcon = style.Icon;
        const isSelf = selfUserId !== undefined && item.userId === selfUserId;
        const name = item.searchHandle ? `@${item.searchHandle}` : "User";
        const href = `/community/${item.searchHandle ?? item.userId}`;
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
          <div
            key={i}
            className="group bg-white p-5 rounded-2xl flex items-center gap-4 transition-all hover:shadow-card"
          >
            {isSelf ? (
              <div className="relative shrink-0">{avatarNode}</div>
            ) : (
              <Link href={href} className="relative shrink-0">
                {avatarNode}
              </Link>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className="text-on-surface text-sm">
                  {isSelf ? (
                    <span className="font-bold">{t("you")}</span>
                  ) : (
                    <Link href={href} className="font-bold hover:underline">
                      {name}
                    </Link>
                  )}{" "}
                  <span className="text-on-surface-variant">{t("completedActivity")}</span>{" "}
                  <span className={`font-semibold ${style.accentText}`}>{item.activity}</span>
                </p>
                <span className="text-[10px] font-bold text-outline uppercase tracking-tighter shrink-0 ml-2">
                  {relativeTime(item.completedAt, t)}
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                <span
                  className={`px-3 py-1 ${style.badgeBg} rounded-full text-[10px] font-bold ${style.badgeText} uppercase tracking-widest`}
                >
                  {categoryLabels[item.category] ?? item.category}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
