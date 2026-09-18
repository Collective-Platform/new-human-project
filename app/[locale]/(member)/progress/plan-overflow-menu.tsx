"use client";

import { useEffect, useState, useTransition } from "react";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";
import { deleteOwnedPlan } from "@/src/features/plans/actions";
import { getBlockLabel } from "@/src/lib/block-names";

export function PlanOverflowMenu({
  locale,
  planId,
  blockNumber,
  isGroup,
  isOwner,
  inviteCode,
}: {
  locale: "en" | "zh";
  planId: string;
  blockNumber: number;
  isGroup: boolean;
  isOwner: boolean;
  inviteCode?: string;
}) {
  const t = useTranslations("plans");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        setOpen(false);
        setDeleteOpen(false);
      }
    }
    if (!open && !deleteOpen) return;
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [deleteOpen, isPending, open]);

  async function copyInvite() {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${locale}/join/${inviteCode}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_500);
    } catch {
      setError(t("copyInviteError"));
    }
  }

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteOwnedPlan({ planId });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.replace("/progress");
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-container-high active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-container"
        aria-label={t("moreActions")}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal size={21} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label={t("close")}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-2 min-w-48 rounded-2xl bg-white p-1.5 shadow-[0_12px_32px_rgba(53,50,47,0.12)]"
          >
            {inviteCode && (
              <button
                type="button"
                role="menuitem"
                onClick={() => void copyInvite()}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-container"
              >
                <Copy size={17} className="text-secondary" />
                {copied ? t("copied") : t("copyInvite")}
              </button>
            )}
            {isOwner && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setError(null);
                  setOpen(false);
                  setDeleteOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-primary transition-colors hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container"
              >
                <Trash2 size={17} />
                {t(isGroup ? "deleteGroupPlan" : "deletePlan")}
              </button>
            )}
            {error && (
              <p role="alert" className="px-3 py-2 text-xs text-primary">
                {error}
              </p>
            )}
          </div>
        </>
      )}

      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 sm:items-center sm:justify-center"
          onClick={() => !isPending && setDeleteOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-plan-title"
            className="w-full max-w-md rounded-3xl bg-surface p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="delete-plan-title"
              className="font-headline text-2xl font-medium text-on-surface"
            >
              {t(isGroup ? "deleteGroupPlan" : "deletePlan")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              {t(isGroup ? "deleteGroupPlanBody" : "deletePlanBody", {
                block: getBlockLabel(blockNumber, locale),
              })}
            </p>
            {isGroup && (
              <p role="alert" className="mt-4 text-sm leading-6 text-on-surface-variant">
                <strong className="font-semibold text-primary">{t("warningLabel")}</strong>{" "}
                {t("deleteGroupWarning")}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-3 text-sm text-primary">
                {error}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeleteOpen(false)}
                className="flex-1 rounded-full bg-surface-container-high px-4 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={confirmDelete}
                className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(190,43,23,0.2)] transition hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? t("deleting") : t(isGroup ? "deleteGroupPlan" : "deletePlan")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
