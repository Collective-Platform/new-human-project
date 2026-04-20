"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface FriendRequest {
  requestId: string;
  userId: number;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export function FriendRequests({
  requests,
  onUpdate,
}: {
  requests: FriendRequest[];
  onUpdate: () => void;
}) {
  const t = useTranslations("community");
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set());

  async function handleAction(requestId: string, action: "accept" | "reject") {
    const res = await fetch(`/api/friends/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    if (res.ok) {
      setHandledIds((prev) => new Set(prev).add(requestId));
      onUpdate();
    }
  }

  const visible = requests.filter((r) => !handledIds.has(r.requestId));
  if (visible.length === 0) return null;

  return (
    <div className="rounded-md bg-white shadow-card divide-y divide-zinc-100">
      {visible.map((req) => (
        <div key={req.requestId} className="flex items-center gap-3 px-4 py-3">
          {req.avatarUrl ? (
            <img
              src={req.avatarUrl}
              alt={req.displayName ?? ""}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200">
              <span className="material-symbols-outlined text-[18px] text-zinc-500">
                person
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate font-headline text-sm font-semibold text-foreground">
              {req.displayName ?? "User"}
            </p>
            <p className="text-xs text-foreground/50">
              {t("sentFriendRequest")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(req.requestId, "accept")}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white active:bg-primary/80"
            >
              {t("accept")}
            </button>
            <button
              onClick={() => handleAction(req.requestId, "reject")}
              className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-foreground/60 active:bg-zinc-200"
            >
              {t("reject")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
