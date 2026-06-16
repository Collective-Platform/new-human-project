"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { requestFriend } from "@/src/features/community/actions";

interface Suggestion {
  id: number;
  displayName: string | null;
  searchHandle: string | null;
  avatarUrl: string | null;
  mutualCount: number;
  connectionStatus: "sent" | "none";
}

export function PeopleYouMayKnow({
  suggestions,
  onAddAction,
}: {
  suggestions: Suggestion[];
  onAddAction: () => void;
}) {
  const t = useTranslations("community");
  const [sentIds, setSentIds] = useState<Set<number>>(
    () => new Set(suggestions.filter((s) => s.connectionStatus === "sent").map((s) => s.id)),
  );
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  async function handleAdd(userId: number) {
    const result = await requestFriend({ receiverId: userId });
    if (!("error" in result)) {
      setSentIds((prev) => new Set(prev).add(userId));
      onAddAction();
    }
  }

  function handleDismiss(userId: number) {
    setDismissedIds((prev) => new Set(prev).add(userId));
  }

  const visible = suggestions.filter((s) => !dismissedIds.has(s.id));
  if (visible.length === 0) return null;

  return (
    <div className="flex overflow-x-auto gap-4 scrollbar-none -mx-6 px-6 pb-2">
      {visible.map((s) => {
        const suggestionName = s.searchHandle ? `@${s.searchHandle}` : "User";

        return (
          <div
            key={s.id}
            className="shrink-0 w-40 bg-surface-container-low rounded-xl p-4 flex flex-col items-center text-center relative"
          >
            <button
              onClick={() => handleDismiss(s.id)}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-surface-container-highest rounded-full text-on-surface-variant"
            >
              <X size={14} />
            </button>
            <Link href={`/community/${s.searchHandle ?? s.id}`} className="contents">
              {s.avatarUrl ? (
                <Image
                  src={s.avatarUrl}
                  alt={suggestionName}
                  width={80}
                  height={80}
                  unoptimized
                  className="w-20 h-20 rounded-full object-cover mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-on-surface-variant font-headline">
                    {suggestionName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <p className="font-bold text-sm truncate w-full mb-0.5 text-on-surface">
                {suggestionName}
              </p>
            </Link>
            <p className="text-xs text-on-surface-variant mb-4">
              {t("mutualFriend", { count: s.mutualCount })}
            </p>
            <button
              onClick={() => handleAdd(s.id)}
              disabled={sentIds.has(s.id)}
              className={`w-full py-1.5 rounded-full text-xs font-bold transition-opacity ${
                sentIds.has(s.id)
                  ? "bg-surface-container-high text-on-surface-variant"
                  : "bg-on-surface text-surface hover:opacity-90"
              }`}
            >
              {sentIds.has(s.id) ? t("requestSent") : t("addFriend")}
            </button>
          </div>
        );
      })}
    </div>
  );
}
