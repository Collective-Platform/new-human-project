"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface FriendRequest {
  requestId: string;
  userId: number;
  displayName: string | null;
  searchHandle: string | null;
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
    <div className="flex flex-col gap-4">
      {visible.map((req) => {
        const requesterName = req.searchHandle
          ? `@${req.searchHandle}`
          : req.displayName ?? "User";

        return (
          <div
            key={req.requestId}
            className="group bg-white p-5 rounded-2xl flex items-center gap-4 transition-all hover:shadow-card"
          >
            {req.avatarUrl ? (
              <Image
                src={req.avatarUrl}
                alt={requesterName}
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
            <div className="flex-1 min-w-0">
              <p className="truncate font-headline text-sm font-bold text-on-surface">
                {requesterName}
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {t("sentFriendRequest")}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleAction(req.requestId, "accept")}
                className="rounded-full bg-on-surface px-3 py-1.5 text-xs font-bold text-surface hover:opacity-90"
              >
                {t("accept")}
              </button>
              <button
                onClick={() => handleAction(req.requestId, "reject")}
                className="rounded-full bg-surface-container-highest px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:opacity-90"
              >
                {t("reject")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
