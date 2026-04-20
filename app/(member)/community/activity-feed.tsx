"use client";

interface FeedItem {
  displayName: string | null;
  avatarUrl: string | null;
  category: string;
  activity: string;
  completedAt: string;
}

const categoryColor: Record<string, string> = {
  Mental: "bg-category-mental text-white",
  Emotional: "bg-category-emotional text-white",
  Physical: "bg-category-physical text-foreground/70",
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed({ items }: { items: FeedItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-md bg-white shadow-card divide-y divide-zinc-100">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          {item.avatarUrl ? (
            <img
              src={item.avatarUrl}
              alt={item.displayName ?? ""}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200">
              <span className="material-symbols-outlined text-[18px] text-zinc-500">
                person
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate font-headline text-sm font-semibold text-foreground">
              {item.displayName ?? "User"}
            </p>
            <p className="truncate text-xs text-foreground/60">
              {item.activity}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                categoryColor[item.category] ?? "bg-zinc-100 text-foreground/60"
              }`}
            >
              {item.category}
            </span>
            <span className="text-[10px] text-foreground/40">
              {relativeTime(item.completedAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
