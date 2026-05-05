"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

interface Friend {
  id: number;
  displayName: string | null;
  searchHandle: string | null;
  avatarUrl: string | null;
  lastActivity: string | null;
}

function Avatar({
  url,
  name,
}: {
  url: string | null;
  name: string | null;
}) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name ?? ""}
        width={56}
        height={56}
        unoptimized
        className="w-14 h-14 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center">
      <span className="material-symbols-outlined text-on-surface-variant">
        person
      </span>
    </div>
  );
}

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

export function FriendsList({ friends }: { friends: Friend[] }) {
  const t = useTranslations("community");

  if (friends.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl text-center text-sm text-on-surface-variant">
        No friends yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {friends.map((friend) => {
        const friendName = friend.searchHandle
          ? `@${friend.searchHandle}`
          : friend.displayName ?? "User";

        return (
          <div
            key={friend.id}
            className="group bg-white p-5 rounded-2xl flex items-center gap-4 transition-all hover:shadow-card"
          >
            <Avatar url={friend.avatarUrl} name={friendName} />
            <div className="flex-1 min-w-0">
              <p className="truncate font-headline text-sm font-bold text-on-surface">
                {friendName}
              </p>
              {friend.lastActivity && (
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {t("completed")} · {relativeTime(friend.lastActivity)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
