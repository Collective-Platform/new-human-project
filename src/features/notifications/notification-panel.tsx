"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";

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

  async function handleOpen() {
    setOpen(true);
    if (localUnread > 0) {
      setLocalUnread(0);
      await fetch("/api/notifications/read", { method: "POST" });
      router.refresh();
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
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
        <div className="fixed inset-0 z-50 flex flex-col bg-surface">
          <div className="border-b border-zinc-100 bg-white">
            <div className="mx-auto flex max-w-93.75 items-center gap-3 px-4 py-3">
              <button
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-zinc-100"
                aria-label="Close"
              >
                <X size={20} className="text-foreground" />
              </button>
              <h1 className="font-headline text-base font-bold text-foreground">Notifications</h1>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-93.75">
              {notifications.length === 0 ? (
                <p className="py-16 text-center text-sm text-on-surface-variant">
                  No notifications yet
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {notifications.map((n) => (
                    <li key={n.id} className="px-4 py-4">
                      <p className="text-sm text-on-surface-variant">{n.body}</p>
                      <p className="mt-1 text-xs text-outline">{relativeTime(n.sentAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
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
