export function StreakBadge({ count, size = "md" }: { count: number; size?: "sm" | "md" }) {
  if (size === "sm") {
    return (
      <div className="flex items-center gap-1 rounded-md border border-foreground/20 px-2 py-0.5">
        <span className="text-xs">🔥</span>
        <p className="font-headline text-xs font-bold text-foreground">{count}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-foreground/20 px-4 py-1 ">
      <span className="text-lg">🔥</span>
      <div>
        <p className="font-headline text-lg font-bold text-foreground">{count}</p>
      </div>
    </div>
  );
}
