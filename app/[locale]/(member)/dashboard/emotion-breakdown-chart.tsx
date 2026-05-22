"use client";

const MOOD_ORDER = ["terrible", "bad", "okay", "good", "excellent"] as const;
const MOOD_EMOJIS: Record<string, string> = {
  terrible: "😡",
  bad: "☹️",
  okay: "😐",
  good: "☺️",
  excellent: "😆",
};

const BAR_MAX_WIDTH = 160;

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
  const max = Math.max(...counts, 1);
  const dateRange = formatDateRange(blockStartDate);

  return (
    <div className="rounded-3xl bg-white shadow-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-outline">{title}</h3>
        <p className="mt-0.5 text-xs text-foreground/40">{dateRange}</p>
      </div>

      {total === 0 ? (
        <p className="text-center text-sm text-outline py-3">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {MOOD_ORDER.map((key, i) => {
            const count = counts[i];
            const barWidth = count > 0
              ? Math.max((count / max) * BAR_MAX_WIDTH, 6)
              : 3;

            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xl leading-none w-7 shrink-0">{MOOD_EMOJIS[key]}</span>
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className="bg-primary transition-all duration-500"
                    style={{ width: `${barWidth}px`, height: "10px" }}
                  />
                  <span className="text-xs tabular-nums text-foreground/50">
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
