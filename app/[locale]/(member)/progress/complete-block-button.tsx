"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toChineseNumeral } from "@/src/lib/chinese-numeral";
import type { completeBlock } from "@/src/features/tasks/actions";

export function CompleteBlockButton({
  blockNumber,
  onCompleteAction,
  onCompletedAction,
}: {
  blockNumber: number;
  onCompleteAction: typeof completeBlock;
  onCompletedAction: () => void;
}) {
  const t = useTranslations("progress");
  const locale = useLocale();
  const block = locale === "zh" ? toChineseNumeral(blockNumber) : blockNumber;
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await onCompleteAction();
      if ("success" in result) {
        setShowConfirm(false);
        onCompletedAction();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="rounded-full bg-primary px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-on-primary transition-all active:scale-95"
      >
        {t("completeButtonLast", { block })}
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={() => !isPending && setShowConfirm(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 font-headline text-lg font-bold text-on-surface">
              {t("completeConfirmTitle", { block })}
            </h2>
            <p className="mb-6 text-sm text-on-surface-variant">{t("completeConfirmBody")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1 rounded-xl border border-outline-variant bg-surface-container px-4 py-3 text-sm font-medium text-on-surface transition-all active:scale-95 disabled:opacity-50"
              >
                {t("completeCancel")}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-on-primary transition-all active:scale-95 disabled:opacity-50"
              >
                {isPending ? "…" : t("completeConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
