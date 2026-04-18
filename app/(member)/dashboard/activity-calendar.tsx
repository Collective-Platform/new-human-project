"use client";

import Link from "next/link";

const categoryColors: Record<string, string> = {
  Mental: "bg-category-mental",
  Emotional: "bg-category-emotional",
  Physical: "bg-category-physical border border-[#d4c8a0]",
};

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

export function ActivityCalendar({
  data,
  month,
  year,
  title,
}: {
  data: { date: string; categories: string[] }[];
  month: number;
  year: number;
  title: string;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dateMap = new Map(data.map((d) => [d.date, d.categories]));

  return (
    <div className="rounded-md bg-white p-5 shadow-card">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground/50">
        {title}
      </p>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {dayLabels.map((label, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-medium text-foreground/40"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`e-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const categories = dateMap.get(dateStr) ?? [];
          const hasActivity = categories.length > 0;

          return (
            <Link
              key={day}
              href={hasActivity ? `/calendar/${dateStr}` : "#"}
              className={`flex flex-col items-center gap-0.5 rounded-sm py-1 transition-colors ${hasActivity ? "hover:bg-zinc-50" : ""}`}
            >
              <span className="text-xs text-foreground/70">{day}</span>
              <div className="flex gap-0.5">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className={`h-1.5 w-1.5 rounded-full ${categoryColors[cat] ?? ""}`}
                  />
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
