"use client";

import { useRef, useEffect } from "react";

interface DayInfo {
  day: number;
  reachable: boolean;
  hasCompletion: boolean;
}

export function DayCarousel({
  days,
  selectedDay,
  onSelect,
  dayLabel,
}: {
  days: DayInfo[];
  selectedDay: number;
  onSelect: (day: number) => void;
  dayLabel: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = el.children[selectedDay - 1] as HTMLElement;
    if (target) {
      target.scrollIntoView({ inline: "center", behavior: "smooth" });
    }
  }, [selectedDay]);

  return (
    <div className="mb-4">
      <p className="mb-2 px-1 text-xs font-medium text-foreground/50">
        {dayLabel}
      </p>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
      >
        {days.map((d) => {
          const isSelected = d.day === selectedDay;
          const isFuture = !d.reachable;

          return (
            <button
              key={d.day}
              disabled={isFuture}
              onClick={() => onSelect(d.day)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-primary text-white"
                  : isFuture
                    ? "bg-zinc-100 text-zinc-300"
                    : d.hasCompletion
                      ? "bg-primary/15 text-primary"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}
            >
              {d.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
