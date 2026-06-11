"use client";

import { useEffect, useState } from "react";

// July 4 2026, 10 AM MYT (UTC+8)
const EVENT_DATE = new Date("2026-07-04T10:00:00+08:00");

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const display = { fontFamily: "var(--font-nowstalgic), serif" } as const;

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: string;
    minutes: string;
    seconds: string;
  } | null>(null);

  useEffect(() => {
    function compute() {
      const diff = EVENT_DATE.getTime() - Date.now();
      if (diff <= 0) return null;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = pad(
        Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      );
      const minutes = pad(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
      const seconds = pad(Math.floor((diff % (1000 * 60)) / 1000));
      return { days, hours, minutes, seconds };
    }

    const init = setTimeout(() => setTimeLeft(compute()), 0);
    const id = setInterval(() => setTimeLeft(compute()), 1000);
    return () => {
      clearTimeout(init);
      clearInterval(id);
    };
  }, []);

  const units = [
    { label: "Days", value: timeLeft ? String(timeLeft.days) : "--" },
    { label: "Hours", value: timeLeft?.hours ?? "--" },
    { label: "Minutes", value: timeLeft?.minutes ?? "--" },
    { label: "Seconds", value: timeLeft?.seconds ?? "--" },
  ];

  return (
    <div className="flex items-end justify-center gap-2 pt-3 pb-6 md:gap-4">
      {units.map(({ label, value }, i) => (
        <div key={label} className="flex items-end gap-2 md:gap-4">
          <div className="flex flex-col items-center">
            <span
              className="tabular-nums text-4xl font-bold leading-none text-white md:text-4xl"
              style={display}
            >
              {value}
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
              {label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span
              className="mb-2 text-2xl font-bold text-white/25 md:text-2xl"
              style={display}
              aria-hidden
            >
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
