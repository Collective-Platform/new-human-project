"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface MoodEntry {
  completedAt: string;
  data: {
    emoji?: string;
    rating?: number;
    influences?: string[];
    context?: string;
  } | null;
}

const emojiMap: Record<number, string> = {
  1: "😢",
  2: "😔",
  3: "😐",
  4: "🙂",
  5: "😄",
};

export function MoodHistoryClient() {
  const t = useTranslations("profile");
  const tMood = useTranslations("mood");
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile/mood-history")
      .then((res) => (res.ok ? res.json() : { entries: [] }))
      .then((data) => setEntries(data.entries))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100"
        >
          <span className="material-symbols-outlined text-[20px] text-foreground/60">
            arrow_back
          </span>
        </Link>
        <h1 className="font-headline text-lg font-bold text-foreground">
          {t("moodHistory")}
        </h1>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && entries.length === 0 && (
        <p className="text-center text-sm text-foreground/50 py-12">
          No mood entries yet
        </p>
      )}

      {!loading && entries.length > 0 && (
        <div className="rounded-md bg-white shadow-card divide-y divide-zinc-100">
          {entries.map((entry, i) => {
            const data = entry.data;
            const emoji = data?.emoji ?? (data?.rating ? emojiMap[data.rating] : "😐");
            const date = new Date(entry.completedAt);

            return (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    {data?.influences && data.influences.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {data.influences.map((inf) => (
                          <span
                            key={inf}
                            className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-foreground/60"
                          >
                            {inf}
                          </span>
                        ))}
                      </div>
                    )}
                    {data?.context && (
                      <p className="text-xs text-foreground/60 line-clamp-2">
                        {data.context}
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] text-foreground/40 whitespace-nowrap">
                    {date.toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
