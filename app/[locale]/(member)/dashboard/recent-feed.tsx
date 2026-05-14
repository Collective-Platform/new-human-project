import { ChevronRight } from "lucide-react";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

const categoryBarColor: Record<string, string> = {
  Mental: "bg-category-mental",
  Emotional: "bg-category-emotional",
  Physical: "bg-category-physical border border-[#d4c8a0]",
};

const sportLabels: Record<string, string> = {
  badminton: "Badminton",
  run: "Run",
  pickleball: "Pickleball",
  swimming: "Swimming",
  pilates: "Pilates",
};

function formatExerciseLabel(data: Record<string, unknown> | null | undefined): string | null {
  if (!data) return null;
  const sportKey = data.sportKey as string | undefined;
  if (!sportKey) return null;
  if (sportKey === "rest") return "Rest";
  const sport =
    sportKey === "others"
      ? ((data.customSport as string | undefined) ?? null)
      : (sportLabels[sportKey] ?? null);
  if (!sport) return null;
  const h = (data.hours as number | undefined) ?? 0;
  const m = (data.minutes as number | undefined) ?? 0;
  if (h === 0 && m === 0) return sport;
  const dur = h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`;
  return `${sport} for ${dur}`;
}

export function RecentFeed({
  items,
  title,
  emptyLabel,
}: {
  items: { category: string; name: string; completedAt: string; completionData?: Record<string, unknown> | null }[];
  title: string;
  emptyLabel: string;
}) {
  return (
    <section className="space-y-4">
      <h3 className="px-2 font-headline text-xl font-bold text-on-surface">{title}</h3>
      {items.length === 0 ? (
        <p className="rounded-md bg-white p-5 text-center text-sm text-on-surface-variant shadow-[0_4px_16px_rgba(53,50,47,0.03)]">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => {
            const exerciseLabel = formatExerciseLabel(item.completionData);
            const displayName = exerciseLabel ?? item.name;
            return (
              <div
                key={i}
                className="flex items-center gap-4 rounded-md bg-white p-4 shadow-[0_4px_16px_rgba(53,50,47,0.03)] transition-transform active:scale-[0.98]"
              >
                <span
                  className={`h-10 w-1.5 shrink-0 rounded-full ${categoryBarColor[item.category] ?? "bg-zinc-300"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-on-surface">{displayName}</p>
                  <p
                    className="truncate text-xs font-medium text-on-surface-variant"
                    suppressHydrationWarning
                  >
                    {item.category} · {relativeTime(item.completedAt)}
                  </p>
                </div>
                <ChevronRight
                  size={22}
                  className="shrink-0 text-outline-variant"
                  aria-hidden="true"
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
