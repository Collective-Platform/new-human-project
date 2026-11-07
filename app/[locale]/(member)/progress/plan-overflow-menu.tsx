"use client";

import { useEffect, useState, useTransition } from "react";
import { Copy, LogOut, MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";
import { deleteOwnedPlan, leaveGroupPlan } from "@/src/features/plans/actions";
import { getBlockLabel } from "@/src/lib/block-names";
import { Overlay } from "@/app/components/overlay";

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
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        setOpen(false);
        setDeleteOpen(false);
        setLeaveOpen(false);
      }
    }
    if (!open && !deleteOpen && !leaveOpen) return;
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [deleteOpen, isPending, leaveOpen, open]);

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

  function confirmLeave() {
    setError(null);
    startTransition(async () => {
      const result = await leaveGroupPlan({ planId });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.replace("/progress");
    });
  }

  const canLeave = isGroup && !isOwner;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="tap-target flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-on-surface/5 press focus:outline-none focus:ring-2 focus:ring-primary-container"
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
            className="absolute right-0 top-full z-20 mt-2 min-w-48 rounded-card bg-white p-1.5 shadow-raised"
          >
            {inviteCode && (
              <button
                type="button"
                role="menuitem"
                onClick={() => void copyInvite()}
                className="tap-target press flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left text-sm font-medium text-on-surface transition-colors hover:bg-on-surface/5 focus:outline-none focus:ring-2 focus:ring-primary-container"
              >
                <Copy size={17} className="text-secondary" />
                {copied ? t("copied") : t("copyInvite")}
              </button>
            )}
            {canLeave && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setError(null);
                  setOpen(false);
                  setLeaveOpen(true);
                }}
                className="tap-target press flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left text-sm font-medium text-primary transition-colors hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container"
              >
                <LogOut size={17} />
                {t("leavePlan")}
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
                className="tap-target press flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left text-sm font-medium text-primary transition-colors hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container"
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

      <Overlay variant="sheet" open={leaveOpen} onClose={() => !isPending && setLeaveOpen(false)}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-plan-title"
          className="w-full max-w-md rounded-sheet bg-surface p-5 shadow-float"
        >
          <h2 id="leave-plan-title" className="font-headline text-2xl font-medium text-on-surface">
            {t("leavePlan")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            {t("leavePlanBody", { block: getBlockLabel(blockNumber, locale) })}
          </p>
          {error && (
            <p role="alert" className="mt-3 text-sm text-primary">
              {error}
            </p>
          )}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setLeaveOpen(false)}
              className="press flex-1 rounded-full bg-surface-container-high px-4 py-3 text-sm font-semibold text-on-surface transition hover:bg-on-surface/5 disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={confirmLeave}
              className="press flex-1 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-on-primary shadow-glow transition hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? t("leaving") : t("leavePlan")}
            </button>
          </div>
        </div>
      </Overlay>

      <Overlay variant="sheet" open={deleteOpen} onClose={() => !isPending && setDeleteOpen(false)}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-plan-title"
          className="w-full max-w-md rounded-sheet bg-surface p-5 shadow-float"
        >
          <h2
            id="delete-plan-title"
            className="font-headline text-center text-2xl font-medium text-on-surface"
          >
            {t(isGroup ? "deleteGroupPlan" : "deletePlanTitle")}
          </h2>
          <p className="mt-2 whitespace-pre-line text-center text-sm leading-6 text-on-surface-variant">
            {isGroup
              ? t("deleteGroupPlanBody", { block: getBlockLabel(blockNumber, locale) })
              : t("deletePlanBody")}
          </p>
          {isGroup && (
            <p role="alert" className="mt-4 text-center text-sm leading-6 text-on-surface-variant">
              <strong className="font-semibold text-primary">{t("warningLabel")}</strong>{" "}
              {t("deleteGroupWarning")}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 text-center text-sm text-primary">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setDeleteOpen(false)}
              className="press w-full rounded-full sm:w-auto sm:flex-1 bg-surface-container-high px-4 py-3 text-sm font-semibold text-on-surface transition hover:bg-on-surface/5 disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={confirmDelete}
              className="press w-full rounded-full sm:w-auto sm:flex-1 bg-primary px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:opacity-90 disabled:opacity-50"
            >
              {isPending
                ? t(isGroup ? "deleting" : "stopping")
                : t(isGroup ? "deleteGroupPlan" : "deletePlanConfirm")}
            </button>
          </div>
        </div>
      </Overlay>
    </div>
  );
}
