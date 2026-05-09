"use client";

import { useTranslations } from "next-intl";

export function BlockEncouragement({ onDismiss }: { onDismiss: () => void }) {
  const t = useTranslations("block");

  return (
    <div className="rounded-md bg-white px-5 py-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🌱</span>
        <div className="flex-1">
          <p className="font-headline text-sm font-semibold text-foreground">
            {t("encourageMessage")}
          </p>
          <p className="mt-1 text-xs text-foreground/60">
            {t("keepGoing")}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-foreground/40 hover:text-foreground/70"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
