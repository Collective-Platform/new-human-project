"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const EVENT_DATE = new Date("2026-10-03T09:00:00+08:00");
const TICKET_URL = "https://live.rhythm.you";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function LiveBanner() {
  const t = useTranslations("liveBanner");
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
        hours: pad(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))),
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
    { label: t("days"), value: timeLeft ? String(timeLeft.days) : "--" },
    { label: t("hours"), value: timeLeft?.hours ?? "--" },
    { label: t("minutes"), value: timeLeft?.minutes ?? "--" },
    { label: t("seconds"), value: timeLeft?.seconds ?? "--" },
  ];

  return (
    <a
      href={TICKET_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-md bg-[#F1A100] p-4 text-black shadow-card transition-transform hover:opacity-95 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      <div className="flex gap-4 items-center">
        <div className="shrink-0">
          <Image
            src="/live/rhythm-live-ii-logo.png"
            alt="Rhythm Live II"
            width={64}
            height={64}
            className="object-contain"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-black/70">{t("dateAndTime")}</p>
              <p className="mt-1 font-nowstalgic text-xl font-black leading-none">
                Rhythm Live II
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-black px-3 py-1 text-xs font-bold text-[#F1A100]">
              {t("cta")}
            </span>
          </div>

          <div className="mt-2 flex gap-3">
            {units.map(({ label, value }, i) => (
              <div key={label} className="flex items-end gap-3">
                <div className="flex flex-col items-center">
                  <span className="tabular-nums text-xl font-black leading-none">{value}</span>
                  <span className="mt-0.5 text-xs font-semibold uppercase tracking-[0.15em] text-black/65">
                    {label}
                  </span>
                </div>
                {i < units.length - 1 && (
                  <span className="mb-1 text-lg font-bold text-black/35" aria-hidden>
                    :
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </a>
  );
}
