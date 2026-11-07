"use client";

import type { ReactNode } from "react";

type SlidingTabsProps<T extends string> = {
  tabs: readonly { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
  /** Classes for the sliding pill. Defaults to the red brand pill. */
  pillClassName?: string;
  /** Classes for the text of the selected tab. */
  activeTextClassName?: string;
};

/**
 * Segmented tabs with one shared pill that slides to the selected tab.
 * All tabs have equal width, so the pill moves by whole-tab steps with a
 * CSS transform. A CSS transition re-targets from its current position,
 * so a quick second tap redirects the pill mid-flight.
 */
export function SlidingTabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  className = "",
  pillClassName = "bg-primary shadow-glow",
  activeTextClassName = "text-on-primary",
}: SlidingTabsProps<T>) {
  const activeIndex = Math.max(
    tabs.findIndex((tab) => tab.value === value),
    0,
  );

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`relative grid gap-0 rounded-full bg-surface-container-high p-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-1 left-1"
        style={{
          width: `calc((100% - 0.5rem) / ${tabs.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
          transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <span className={`block h-full w-full rounded-full ${pillClassName}`} />
      </span>
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={`tap-target relative z-10 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors duration-(--duration-base) focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
              selected ? activeTextClassName : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
