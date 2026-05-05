"use client";

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

export function RecentFeed({
  items,
  title,
  emptyLabel,
}: {
  items: { category: string; name: string; completedAt: string }[];
  title: string;
  emptyLabel: string;
}) {
  return (
    <section className="space-y-4">
      <h3 className="px-2 font-headline text-xl font-bold text-on-surface">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="rounded-md bg-white p-5 text-center text-sm text-on-surface-variant shadow-[0_4px_16px_rgba(53,50,47,0.03)]">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-md bg-white p-4 shadow-[0_4px_16px_rgba(53,50,47,0.03)] transition-transform active:scale-[0.98]"
            >
              <span
                className={`h-10 w-1.5 shrink-0 rounded-full ${categoryBarColor[item.category] ?? "bg-zinc-300"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-on-surface">
                  {item.name}
                </p>
                <p className="truncate text-xs font-medium text-on-surface-variant">
                  {item.category} · {relativeTime(item.completedAt)}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="material-symbols-outlined shrink-0 text-[22px] text-outline-variant"
              >
                chevron_right
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
