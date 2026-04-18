"use client";

export function StreakBadge({
  count,
  label,
}: {
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-white px-4 py-3 shadow-card">
      <span className="text-2xl">🔥</span>
      <div>
        <p className="font-headline text-xl font-bold text-foreground">
          {count}
        </p>
        <p className="text-xs text-foreground/60">{label}</p>
      </div>
    </div>
  );
}
