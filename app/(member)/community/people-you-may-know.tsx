"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface Suggestion {
  id: number;
  displayName: string | null;
  avatarUrl: string | null;
  mutualCount: number;
}

export function PeopleYouMayKnow({
  suggestions,
  onAdd,
}: {
  suggestions: Suggestion[];
  onAdd: () => void;
}) {
  const t = useTranslations("community");
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  async function handleAdd(userId: number) {
    const res = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: userId }),
    });
    if (res.ok) {
      setSentIds((prev) => new Set(prev).add(userId));
      onAdd();
    }
  }

  function handleDismiss(userId: number) {
    setDismissedIds((prev) => new Set(prev).add(userId));
  }

  const visible = suggestions.filter((s) => !dismissedIds.has(s.id));
  if (visible.length === 0) return null;

  return (
    <div className="flex overflow-x-auto gap-4 scrollbar-none -mx-6 px-6 pb-2">
      {visible.map((s) => (
        <div
          key={s.id}
          className="flex-shrink-0 w-40 bg-surface-container-low rounded-xl p-4 flex flex-col items-center text-center relative"
        >
          <button
            onClick={() => handleDismiss(s.id)}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-surface-container-highest rounded-full text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
          {s.avatarUrl ? (
            <Image
              src={s.avatarUrl}
              alt={s.displayName ?? ""}
              width={80}
              height={80}
              unoptimized
              className="w-20 h-20 rounded-full object-cover mb-3"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-on-surface-variant font-headline">
                {(s.displayName ?? "U").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <p className="font-bold text-sm truncate w-full mb-0.5 text-on-surface">
            {s.displayName ?? "User"}
          </p>
          <p className="text-xs text-on-surface-variant mb-4">
            {t("mutualFriend", { count: s.mutualCount })}
          </p>
          <button
            onClick={() => handleAdd(s.id)}
            disabled={sentIds.has(s.id)}
            className={`w-full py-1.5 rounded-full text-xs font-bold transition-opacity ${
              sentIds.has(s.id)
                ? "bg-surface-container-highest text-on-surface-variant"
                : "bg-on-surface text-surface hover:opacity-90"
            }`}
          >
            {sentIds.has(s.id) ? "Sent" : t("addFriend")}
          </button>
        </div>
      ))}
    </div>
  );
}
