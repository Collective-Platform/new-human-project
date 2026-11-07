export function StreakBadge({ count, size = "md" }: { count: number; size?: "sm" | "md" }) {
  if (size === "sm") {
    return (
      <div className="flex items-center gap-1 rounded-full border border-foreground/20 px-2 py-0.5">
        <span className="text-xs">🔥</span>
        <p className="font-headline text-xs font-semibold text-foreground">{count}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-foreground/20 px-4 py-1 ">
      <span className="text-lg">🔥</span>
      <div>
        <p className="font-headline text-lg font-semibold text-foreground">{count}</p>
      </div>
    </div>
  );
}
