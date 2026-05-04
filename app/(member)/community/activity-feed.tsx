"use client";

import Image from "next/image";

interface FeedItem {
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
    icon: string;
  }
> = {
  Mental: {
    badgeBg: "bg-primary-container",
    badgeText: "text-on-primary-container",
    iconBg: "bg-primary",
    accentText: "text-primary",
    icon: "psychology",
  },
  Emotional: {
    badgeBg: "bg-secondary-container",
    badgeText: "text-on-secondary-container",
    iconBg: "bg-secondary",
    accentText: "text-secondary",
    icon: "favorite",
  },
  Physical: {
    badgeBg: "bg-tertiary-container",
    badgeText: "text-on-tertiary-fixed-variant",
    iconBg: "bg-tertiary",
    accentText: "text-tertiary",
    icon: "fitness_center",
  },
};

const defaultStyle = {
  badgeBg: "bg-surface-container",
  badgeText: "text-on-surface-variant",
  iconBg: "bg-on-surface",
  accentText: "text-on-surface",
  icon: "check_circle",
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed({ items }: { items: FeedItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => {
        const style = categoryStyles[item.category] ?? defaultStyle;
        const name = item.searchHandle
          ? `@${item.searchHandle}`
          : item.displayName ?? "User";
        return (
          <div
            key={i}
            className="group bg-white p-5 rounded-2xl flex items-center gap-4 transition-all hover:shadow-card"
          >
            <div className="relative">
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
                  <span className="material-symbols-outlined text-on-surface-variant">
                    person
                  </span>
                </div>
              )}
              <div
                className={`absolute -bottom-1 -right-1 ${style.iconBg} p-1.5 rounded-full border-4 border-white`}
              >
                <span className="material-symbols-outlined text-[12px] text-white block">
                  {style.icon}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className="text-on-surface text-sm">
                  <span className="font-bold">{name}</span>{" "}
                  <span className="text-on-surface-variant">completed</span>{" "}
                  <span className={`font-semibold ${style.accentText}`}>
                    {item.activity}
                  </span>
                </p>
                <span className="text-[10px] font-bold text-outline uppercase tracking-tighter shrink-0 ml-2">
                  {relativeTime(item.completedAt)}
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                <span
                  className={`px-3 py-1 ${style.badgeBg} rounded-full text-[10px] font-bold ${style.badgeText} uppercase tracking-widest`}
                >
                  {item.category}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
