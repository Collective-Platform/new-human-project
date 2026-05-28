"use client";

import Image from "next/image";

const MOOD_ORDER = ["excellent", "good", "okay", "bad", "terrible"] as const;
const MOOD_EMOJIS: Record<string, string> = {
  terrible: "😡",
  bad: "☹️",
  okay: "😐",
  good: "☺️",
  excellent: "😆",
};
const MOOD_LABELS: Record<string, string> = {
  terrible: "Terrible",
  bad: "Bad",
  okay: "Okay",
  good: "Good",
  excellent: "Excellent",
};

function formatDateRange(startIso: string): string {
  const start = new Date(startIso + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 24); // day 1 → day 25 = +24 days

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return `${fmt(start)} – ${fmt(end)}`;
}

export function EmotionBreakdownChart({
  breakdown,
  title,
  emptyLabel,
  blockStartDate,
}: {
  breakdown: Record<string, number>;
  title: string;
  emptyLabel: string;
  blockStartDate: string;
}) {
  const counts = MOOD_ORDER.map((k) => breakdown[k] ?? 0);
  const total = counts.reduce((a, b) => a + b, 0);
  const dateRange = formatDateRange(blockStartDate);

  return (
    <div className="rounded-3xl bg-white shadow-card px-8 py-5">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Image src="/icons/Emotional.svg" alt="" width={28} height={28} />
          <h3 className="text-xl font-headline tracking-tight font-medium text-category-emotional">
            {title}
          </h3>
        </div>
        <p className="mt-0.5 text-xs text-foreground/40">{dateRange}</p>
      </div>

      {total === 0 ? (
        <p className="text-center text-sm text-outline py-3">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {MOOD_ORDER.map((key, i) => {
            const count = counts[i];
            const percentage = total > 0 ? (count / total) * 100 : 0;

            return (
              <div
                key={key}
                className="flex items-center gap-3 bg-gray-50/50 hover:bg-[#256a65]/5 p-2 rounded-xl transition-all duration-150 border border-gray-100"
              >
                <span className="text-lg shrink-0">{MOOD_EMOJIS[key]}</span>

                <div className="flex-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-foreground/50 mb-0.5">
                    <span>{MOOD_LABELS[key]}</span>
                    <span className="text-category-emotional font-mono">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-(--color-bar-track) rounded-full overflow-hidden">
                    <div
                      className="h-full bg-(--color-category-emotional) rounded-full transition-all duration-500"
                      style={{
                        width: `${count > 0 ? Math.max(percentage, 3.5) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="min-w-5 text-right text-xs font-bold text-foreground/60 font-mono">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
