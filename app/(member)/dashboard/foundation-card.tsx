"use client";

import Link from "next/link";

const foundationColors = [
  "bg-[#f8d7da]",
  "bg-[#f1b0b7]",
  "bg-[#e4606d]",
  "bg-[#d93749]",
  "bg-[#c10014]",
  "bg-[#d93749]",
  "bg-[#c10014]",
  "bg-[#ab0010]",
  "bg-[#90000c]",
  "bg-surface-container-highest",
  "bg-surface-container-high",
  "bg-surface-container-high",
  "bg-surface-container-high",
  "bg-surface-container-high",
  "bg-surface-container-high",
];

export function FoundationCard() {
  return (
    <section className="flex flex-col justify-between rounded-md border border-surface-container bg-white p-8 shadow-card">
      <div>
        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-primary">
          The Foundation
        </p>
        <h3 className="mb-4 font-headline text-2xl font-bold text-on-surface">
          The 25-Day Block
        </h3>
        <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
          Inspired by the life Jesus has won for us, this project guides you
          through a series of 25-day blocks covering mental, emotional, and
          physical growth. Each cycle brings you closer to making these
          practices a natural way of life.
        </p>
        <div className="mb-8 grid grid-cols-5 gap-2">
          {foundationColors.map((color, index) => (
            <span
              key={index}
              className={`aspect-square rounded-sm ${color}`}
              aria-label={`Foundation marker ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <Link
        href="/progress"
        className="flex w-full items-center justify-center rounded-full bg-primary px-6 py-4 font-bold text-white shadow-lg shadow-red-200 transition-transform active:scale-95"
      >
        Start Journey
        <span
          aria-hidden="true"
          className="material-symbols-outlined ml-2 text-[20px] transition-transform"
        >
          chevron_right
        </span>
      </Link>
    </section>
  );
}
