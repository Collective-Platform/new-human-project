"use client";

const colorMap: Record<number, string> = {
  "-1": "bg-zinc-100 text-zinc-300",
  "0": "bg-zinc-200 text-zinc-400",
  "1": "bg-primary/20 text-primary/60",
  "2": "bg-primary/50 text-white",
  "3": "bg-primary text-white",
};

export function BlockGrid({
  days,
  title,
}: {
  days: { day: number; categoriesCompleted: number }[];
  title: string;
}) {
  return (
    <div className="rounded-md bg-white p-5 shadow-card">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground/50">
        {title}
      </p>
      <div className="grid grid-cols-5 gap-2">
        {days.map((d) => (
          <div
            key={d.day}
            className={`flex aspect-square items-center justify-center rounded-sm text-xs font-medium ${
              colorMap[d.categoriesCompleted] ?? colorMap[0]
            }`}
          >
            {d.day}
          </div>
        ))}
      </div>
    </div>
  );
}
