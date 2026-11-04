"use client";

import { useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { PlanDaySocial } from "../plans/plan-day-social";
import { useNavVisibility } from "../nav-visibility";
import type { PlanDiscussionThread, PlanMember } from "@/src/features/plans/queries";
import type { ProgressTask } from "@/src/features/progress";

export function GroupDiscussionTask({
  locale,
  planId,
  selectedDay,
  selfUserId,
  isOwner,
  initialData,
  blockNumber,
  categoryTasks,
  onNavigateAction,
  onCloseAction,
}: {
  locale: "en" | "zh";
  planId: string;
  selectedDay: number;
  selfUserId: number;
  isOwner: boolean;
  initialData: { members: PlanMember[]; discussion: PlanDiscussionThread[] };
  blockNumber: number;
  categoryTasks: ProgressTask[];
  onNavigateAction: (task: ProgressTask) => void;
  onCloseAction: () => void;
}) {
  const t = useTranslations("progress");
  const { setHidden } = useNavVisibility();

  useEffect(() => {
    setHidden(true);
    return () => setHidden(false);
  }, [setHidden]);

  const currentIndex = categoryTasks.findIndex((task) => task.taskType === "group_discussion");
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < categoryTasks.length - 1;

  function goPrevious() {
    if (hasPrev) onNavigateAction(categoryTasks[currentIndex - 1]);
  }

  function goNext() {
    if (hasNext) onNavigateAction(categoryTasks[currentIndex + 1]);
    else onCloseAction();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      <header className="border-b border-zinc-100 bg-white px-4 sm:px-6 md:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-3 py-3">
          <button
            type="button"
            onClick={onCloseAction}
            className="flex h-7 w-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-container"
            aria-label={t("closeTask")}
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="flex-1 truncate font-headline text-lg font-medium text-foreground">
            {t("talkItOut")}
          </h2>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 md:px-8">
        <div className="mx-auto max-w-3xl">
          <PlanDaySocial
            locale={locale}
            planId={planId}
            selectedDay={selectedDay}
            selfUserId={selfUserId}
            isOwner={isOwner}
            initialData={initialData}
            showControls={false}
          />
        </div>
      </main>

      <footer className="shrink-0 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-3 py-5">
          {hasPrev ? (
            <button
              type="button"
              onClick={goPrevious}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm transition-all hover:bg-zinc-50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-container"
              aria-label={t("previousTask")}
            >
              <ArrowLeft size={20} className="text-foreground" />
            </button>
          ) : (
            <div className="h-9 w-9 shrink-0" />
          )}
          <div className="flex flex-1 flex-col items-center justify-center text-center leading-tight">
            <span className="text-sm font-semibold text-foreground">
              {t("blockLabel", { block: blockNumber })} | {t("mental")}
            </span>
            <span className="text-xs text-foreground/60">
              {t("dayLabel", { day: selectedDay })} | {currentIndex + 1} of {categoryTasks.length}
            </span>
          </div>
          <button
            type="button"
            onClick={goNext}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-all hover:opacity-90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-container"
            aria-label={t("nextTask")}
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}
