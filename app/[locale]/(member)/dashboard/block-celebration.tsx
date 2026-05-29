"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
  onDismissAction,
}: {
  badge: EarnedBadge;
  onDismissAction: () => void;
}) {
  const t = useTranslations("block");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation on next frame
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function handleDismiss() {
    setVisible(false);
    setTimeout(onDismissAction, 300);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleDismiss} />

      {/* Content */}
      <div
        className={`relative mx-6 flex max-w-sm flex-col items-center rounded-md bg-white px-8 py-10 shadow-card transition-transform duration-300 ${
          visible ? "scale-100" : "scale-90"
        }`}
      >
        {/* Badge icon / emoji */}
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          {badge.iconUrl ? (
            <Image
              src={badge.iconUrl}
              alt={badge.name}
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 object-contain"
            />
          ) : (
            <span className="text-5xl">🏆</span>
          )}
        </div>

        {/* Title */}
        <h2 className="mb-2 text-center font-headline text-2xl font-bold text-foreground">
          {t("blockComplete", { block: badge.blockNumber })}
        </h2>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="mt-2 rounded-full bg-primary px-8 py-3 font-headline text-sm font-semibold text-white transition-colors active:bg-primary/80"
        >
          {t("continue")}
        </button>
      </div>
    </div>
  );
}
