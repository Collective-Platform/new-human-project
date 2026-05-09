"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface EarnedBadge {
  name: string;
  description: string | null;
  iconUrl: string | null;
  blockNumber: number;
  earnedAt: string;
}

export function BlockCelebration({
  badge,
  onDismiss,
}: {
  badge: EarnedBadge;
  onDismiss: () => void;
}) {
  const t = useTranslations("block");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation on next frame
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function handleDismiss() {
    setVisible(false);
    setTimeout(onDismiss, 300);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleDismiss}
      />

      {/* Content */}
      <div
        className={`relative mx-6 flex max-w-sm flex-col items-center rounded-md bg-white px-8 py-10 shadow-card transition-transform duration-300 ${
          visible ? "scale-100" : "scale-90"
        }`}
      >
        {/* Badge icon / emoji */}
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          {badge.iconUrl ? (
            <img
              src={badge.iconUrl}
              alt={badge.name}
              className="h-16 w-16 object-contain"
            />
          ) : (
            <span className="text-5xl">🏆</span>
          )}
        </div>

        {/* Flourish particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="absolute block h-2 w-2 rounded-full"
              style={{
                backgroundColor: ["#c10014", "#135db9", "#f59e0b", "#10b981"][
                  i % 4
                ],
                left: `${15 + (i * 70) / 12}%`,
                top: `${10 + ((i * 37) % 60)}%`,
                animation: `celebrationFloat ${1.5 + (i % 3) * 0.5}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.12}s`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>

        {/* Title */}
        <h2 className="mb-2 text-center font-headline text-2xl font-bold text-foreground">
          {t("blockComplete", { block: badge.blockNumber })}
        </h2>

        {/* Badge name */}
        <p className="mb-1 text-center font-headline text-lg font-semibold text-primary">
          {badge.name}
        </p>

        {/* Description */}
        {badge.description && (
          <p className="mb-6 text-center text-sm text-foreground/60">
            {badge.description}
          </p>
        )}

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="rounded-full bg-primary px-8 py-3 font-headline text-sm font-semibold text-white transition-colors active:bg-primary/80"
        >
          {t("continue")}
        </button>
      </div>
    </div>
  );
}
