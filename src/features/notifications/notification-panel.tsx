"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

type NotificationRow = {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  sentAt: Date;
  readAt: Date | null;
};

export function NotificationPanel({
  notifications,
  unreadCount,
}: {
  notifications: NotificationRow[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [localUnread, setLocalUnread] = useState(unreadCount);
  const router = useRouter();

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && localUnread > 0) {
      setLocalUnread(0);
      await fetch("/api/notifications/read", { method: "POST" });
      router.refresh();
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center rounded-full p-1 text-zinc-600 hover:bg-zinc-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {localUnread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white">
            {localUnread > 9 ? "9+" : localUnread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-80 overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-lg">
            <div className="border-b border-zinc-100 px-4 py-3">
              <p className="text-sm font-semibold text-zinc-800">Notifications</p>
            </div>
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">No notifications yet</p>
            ) : (
              <ul className="max-h-80 divide-y divide-zinc-50 overflow-y-auto">
                {notifications.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <p className="text-sm text-zinc-800">{n.body}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">{relativeTime(n.sentAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
