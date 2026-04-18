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

const categoryDotColor: Record<string, string> = {
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
    <div className="rounded-md bg-white shadow-card">
      <p className="px-5 pt-5 pb-2 text-xs font-medium uppercase tracking-wider text-foreground/50">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="px-5 pb-5 text-center text-sm text-foreground/50">
          {emptyLabel}
        </p>
      ) : (
        <div className="divide-y divide-zinc-100">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${categoryDotColor[item.category] ?? "bg-zinc-300"}`}
              />
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {item.name}
              </p>
              <span className="shrink-0 text-xs text-foreground/50">
                {relativeTime(item.completedAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
