"use client";

export function StreakBadge({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-foreground/20 px-4 py-1 ">
      <span className="text-lg">🔥</span>
      <div>
        <p className="font-headline text-lg font-bold text-foreground">
          {count}
        </p>
      </div>
    </div>
  );
}
