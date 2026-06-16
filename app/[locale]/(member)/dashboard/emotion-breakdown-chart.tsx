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

export function EmotionBreakdownChart({
  breakdown,
  title,
  emptyLabel,
  blockLabel,
}: {
  breakdown: Record<string, number>;
  title: string;
  emptyLabel: string;
  blockLabel: string;
}) {
  const counts = MOOD_ORDER.map((k) => breakdown[k] ?? 0);
  const total = counts.reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-3xl bg-white shadow-card px-8 py-5">
      <div className="mb-4 flex items-center gap-2">
        <Image src="/icons/Emotional.svg" alt="" width={28} height={28} />
        <div>
          <h3 className="text-xl font-headline tracking-tight font-medium text-category-emotional">
            {title}
          </h3>
          <p className="text-xs text-foreground/40">{blockLabel}</p>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-center text-sm text-outline py-3">{emptyLabel}</p>
      ) : (
        <div className="space-y-0.5">
          {MOOD_ORDER.map((key, i) => {
            const count = counts[i];
            const percentage = total > 0 ? (count / total) * 100 : 0;

            return (
              <div key={key} className="flex items-center gap-3 px-2 py-1 rounded-xl">
                <span className="text-lg shrink-0">{MOOD_EMOJIS[key]}</span>

                <div className="flex-1">
                  <div className="flex justify-between items-center text-[10px] text-foreground mb-0.5">
                    <span>{MOOD_LABELS[key]}</span>
                    <span>{count}</span>
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

                <div className="min-w-8 text-right text-xs font-medium text-category-emotional">
                  {Math.round(percentage)}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
