"use client";

import { useTranslations } from "next-intl";

interface Friend {
  id: number;
  displayName: string | null;
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
      <img
        src={url}
        alt={name ?? ""}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200">
      <span className="material-symbols-outlined text-[18px] text-zinc-500">
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
      <div className="rounded-md bg-white p-5 shadow-card text-center text-sm text-foreground/50">
        No friends yet
      </div>
    );
  }

  return (
    <div className="rounded-md bg-white shadow-card divide-y divide-zinc-100">
      {friends.map((friend) => (
        <div key={friend.id} className="flex items-center gap-3 px-4 py-3">
          <Avatar url={friend.avatarUrl} name={friend.displayName} />
          <div className="flex-1 min-w-0">
            <p className="truncate font-headline text-sm font-semibold text-foreground">
              {friend.displayName ?? "User"}
            </p>
            {friend.lastActivity && (
              <p className="text-xs text-foreground/50">
                {t("completed")} · {relativeTime(friend.lastActivity)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
