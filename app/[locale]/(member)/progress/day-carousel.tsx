"use client";

import { useRef, useEffect } from "react";

interface DayInfo {
  day: number;
  reachable: boolean;
  fullyCompleted: boolean;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getDateForDay(
  blockStartDate: string,
  day: number,
  locale: string,
): string {
  const start = new Date(blockStartDate);
  const date = new Date(start);
  date.setDate(start.getDate() + (day - 1));
  if (locale === "zh") {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

export function DayCarousel({
  days,
  selectedDay,
  onSelectAction,
  onPrefetchAction,
  blockStartDate,
  currentDay,
  locale = "en",
  todayLabel = "Today",
}: {
  days: DayInfo[];
  selectedDay: number;
  onSelectAction: (day: number) => void;
  /**
   * Fired when the user hovers or touches a day chip — warms the
   * day's data cache so a subsequent tap resolves instantly. (Task 3.0)
   */
  onPrefetchAction?: (day: number) => void;
  blockStartDate: string;
  currentDay: number;
  locale?: string;
  todayLabel?: string;
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

          const warm = () => {
            if (onPrefetchAction && d.day !== selectedDay)
              onPrefetchAction(d.day);
          };

          return (
            <button
              key={d.day}
              onClick={() => onSelectAction(d.day)}
              onMouseEnter={warm}
              onTouchStart={warm}
              onFocus={warm}
              className="shrink-0 flex flex-col items-center gap-1.5 group"
            >
              <div
                className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? "bg-primary text-white shadow-lg"
                    : d.fullyCompleted
                      ? "bg-primary/15 text-primary hover:bg-primary/25"
                      : "border-[0.5px] border-zinc-500/50 text-zinc-500 hover:bg-zinc-200"
                }`}
              >
                <span
                  className={`text-[10px] font-light tracking-tighter ${
                    isSelected
                      ? "text-white/70"
                      : d.fullyCompleted
                        ? "text-primary/60"
                        : "text-zinc-400"
                  }`}
                >
                  Day
                </span>
                <span
                  className={`text-lg font-medium leading-none ${
                    isSelected
                      ? "text-white"
                      : d.fullyCompleted
                        ? "text-primary"
                        : "text-zinc-600"
                  }`}
                >
                  {d.day}
                </span>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 ${
                  isToday
                    ? "rounded-full border-primary/80 text-primary/80 border font-medium"
                    : isSelected
                      ? "font-medium text-foreground"
                      : "font-medium text-foreground/50 group-hover:text-foreground/70"
                }`}
              >
                {isToday
                  ? todayLabel
                  : getDateForDay(blockStartDate, d.day, locale)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
