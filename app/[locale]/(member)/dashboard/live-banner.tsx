"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const EVENT_DATE = new Date("2026-07-04T10:00:00+08:00");
const TICKET_URL = "https://live.rhythm.you";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function LiveBanner() {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: string;
    minutes: string;
    seconds: string;
  } | null>(null);
  const [past, setPast] = useState(false);

  useEffect(() => {
    function compute() {
      const diff = EVENT_DATE.getTime() - Date.now();
      if (diff <= 0) {
        setPast(true);
        return null;
      }
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: pad(
          Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        ),
        minutes: pad(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))),
        seconds: pad(Math.floor((diff % (1000 * 60)) / 1000)),
      };
    }

    const init = setTimeout(() => setTimeLeft(compute()), 0);
    const id = setInterval(() => setTimeLeft(compute()), 1000);
    return () => {
      clearTimeout(init);
      clearInterval(id);
    };
  }, []);

  if (past) return null;

  const units = [
    { label: "Days", value: timeLeft ? String(timeLeft.days) : "--" },
    { label: "Hrs", value: timeLeft?.hours ?? "--" },
    { label: "Min", value: timeLeft?.minutes ?? "--" },
    { label: "Sec", value: timeLeft?.seconds ?? "--" },
  ];

  return (
    <div className="rounded-md bg-foreground p-4 text-white shadow-card">
      <div className="flex gap-4 items-center">
        <div className="shrink-0">
          <Image
            src="/live/rhythm-live-logo.png"
            alt="Rhythm Live"
            width={80}
            height={80}
            className="rounded-sm object-contain"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-white/60">July 4 · 10AM–3PM</p>
              <Image
                src="/live/rhythm-live-title.png"
                alt="Rhythm Live"
                width={140}
                height={140}
                className="mt-1 object-contain"
              />
            </div>
            <a
              href={TICKET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
            >
              Get Tickets
            </a>
          </div>

          <div className="mt-1 flex gap-3">
            {units.map(({ label, value }, i) => (
              <div key={label} className="flex items-end gap-3">
                <div className="flex flex-col items-center">
                  <span className="tabular-nums text-2xl font-black leading-none">
                    {value}
                  </span>
                  <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/40">
                    {label}
                  </span>
                </div>
                {i < units.length - 1 && (
                  <span
                    className="mb-1 text-lg font-bold text-white/25"
                    aria-hidden
                  >
                    :
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
