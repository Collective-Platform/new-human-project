"use client";

import { useState } from "react";
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

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-foreground/50">
        {t("peopleYouMayKnow")}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {suggestions.map((s) => (
          <div
            key={s.id}
            className="flex w-32 shrink-0 flex-col items-center rounded-md bg-white p-4 shadow-card"
          >
            {s.avatarUrl ? (
              <img
                src={s.avatarUrl}
                alt={s.displayName ?? ""}
                className="mb-2 h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200">
                <span className="material-symbols-outlined text-[24px] text-zinc-500">
                  person
                </span>
              </div>
            )}
            <p className="mb-1 truncate w-full text-center font-headline text-xs font-semibold text-foreground">
              {s.displayName ?? "User"}
            </p>
            <p className="mb-2 text-[10px] text-foreground/50">
              {t("mutualFriend", { count: s.mutualCount })}
            </p>
            <button
              onClick={() => handleAdd(s.id)}
              disabled={sentIds.has(s.id)}
              className={`w-full rounded-full py-1.5 text-[10px] font-semibold transition-colors ${
                sentIds.has(s.id)
                  ? "bg-zinc-100 text-foreground/40"
                  : "bg-primary text-white active:bg-primary/80"
              }`}
            >
              {sentIds.has(s.id) ? "Sent" : t("addFriend")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
