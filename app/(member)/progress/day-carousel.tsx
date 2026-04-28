"use client";

import { useRef, useEffect } from "react";

interface DayInfo {
  day: number;
  reachable: boolean;
  hasCompletion: boolean;
}

function getDateForDay(blockStartDate: string, day: number): string {
  const start = new Date(blockStartDate);
  const date = new Date(start);
  date.setDate(start.getDate() + (day - 1));
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${monthNames[date.getMonth()]} ${date.getDate()}`;
}

export function DayCarousel({
  days,
  selectedDay,
  onSelect,
  dayLabel,
  blockStartDate,
  currentDay,
}: {
  days: DayInfo[];
  selectedDay: number;
  onSelect: (day: number) => void;
  dayLabel: string;
  blockStartDate: string;
  currentDay: number;
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
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-none py-2 -mx-2 px-2"
      >
        {days.map((d) => {
          const isSelected = d.day === selectedDay;
          const isToday = d.day === currentDay;

          return (
            <button
              key={d.day}
              onClick={() => onSelect(d.day)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
            >
              <div
                className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
                  isToday ? "border-2 border-black" : ""
                } ${
                  isSelected
                    ? "bg-primary text-white shadow-lg"
                    : d.hasCompletion
                      ? "bg-primary/15 text-primary hover:bg-primary/25"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-tighter ${
                    isSelected ? "text-white/70" : d.hasCompletion ? "text-primary/60" : "text-zinc-400"
                  }`}
                >
                  Day
                </span>
                <span
                  className={`text-lg font-bold leading-none ${
                    isSelected ? "text-white" : d.hasCompletion ? "text-primary" : "text-zinc-600"
                  }`}
                >
                  {d.day}
                </span>
              </div>
              <span
                className={`text-[11px] ${
                  isSelected
                    ? "font-bold text-foreground"
                    : "font-semibold text-foreground/50 group-hover:text-foreground/70"
                }`}
              >
                {isToday ? "Today" : getDateForDay(blockStartDate, d.day)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
