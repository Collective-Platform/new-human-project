"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Overlay } from "@/app/components/overlay";

interface EarnedBadge {
  memberBadgeId: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  blockNumber: number;
  earnedAt: string;
}

export function BlockCelebration({
  badge,
  blockNumber,
  onDismissAction,
}: {
  badge?: EarnedBadge;
  blockNumber?: number;
  onDismissAction: () => void;
}) {
  const t = useTranslations("block");
  const [open, setOpen] = useState(true);
  const completedBlockNumber = badge?.blockNumber ?? blockNumber ?? 0;

  // Dismissing plays the exit animation first; the parent is told once it is done.
  function handleDismiss() {
    setOpen(false);
  }

  return (
    <Overlay variant="center" open={open} onClose={handleDismiss} onExited={onDismissAction}>
      <div className="relative flex w-full max-w-sm flex-col items-center rounded-sheet bg-white px-8 py-10 shadow-card">
        {/* Badge icon / emoji */}
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          {badge?.iconUrl ? (
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
        <h2 className="mb-2 text-center font-headline text-2xl font-semibold text-foreground">
          {t("blockComplete", { block: completedBlockNumber })}
        </h2>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="press mt-2 rounded-full bg-primary px-8 py-3 font-headline text-sm font-semibold text-white transition-colors active:bg-primary/80"
        >
          {t("continue")}
        </button>
      </div>
    </Overlay>
  );
}
