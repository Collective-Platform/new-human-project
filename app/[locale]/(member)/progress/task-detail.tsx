"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ProgramTask } from "@/src/features/content/program";
import { useNavVisibility } from "../nav-visibility";
import { MoodLogRenderer } from "./renderers/mood-log";
import { ExerciseLogRenderer } from "./renderers/exercise-log";
import { BilingualPassage } from "./renderers/bilingual-passage";
import { SectionedContentRenderer } from "./renderers/sectioned-content";
import { localizeScriptureRef } from "@/src/features/bible/localize";

interface TaskData {
  id: string;
  category: string;
  taskType: string;
  name: string;
  content: Record<string, unknown> | null;
  completed: boolean;
  completionData: Record<string, unknown> | null;
  body?: string;
  passageRef?: string;
  scriptureRef?: string;
  inputs?: string[];
}

const EMPTY_CONTENT: Record<string, unknown> = {};

export function TaskDetail({
  task,
  locale,
  blockNumber,
  dayNumber,
  onCompleteAction,
  onCloseAction,
  categoryTasks,
  onNavigateAction,
  mode = "add",
}: {
  task: TaskData;
  locale: string;
  blockNumber: number;
  dayNumber: number;
  onCompleteAction: (taskId: string, data?: Record<string, unknown>) => Promise<void>;
  onCloseAction: () => void;
  categoryTasks: TaskData[];
  onNavigateAction: (task: TaskData) => void;
  mode?: "add" | number;
}) {
  const t = useTranslations("progress");
  const [loading, setLoading] = useState(false);
  const { setHidden } = useNavVisibility();

  // Hide bottom nav while inside a Mental or Emotional activity
  useEffect(() => {
    if (task.category === "Mental" || task.category === "Emotional") {
      setHidden(true);
      return () => setHidden(false);
    }
  }, [task.category, setHidden]);

  const currentIndex = categoryTasks.findIndex((t) => t.id === task.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < categoryTasks.length - 1;

  const handleNext = useCallback(() => {
    if (!task.completed) {
      void onCompleteAction(task.id);
    }
    if (hasNext) {
      onNavigateAction(categoryTasks[currentIndex + 1]);
    } else {
      onCloseAction();
    }
  }, [
    onCompleteAction,
    task.id,
    task.completed,
    hasNext,
    categoryTasks,
    currentIndex,
    onNavigateAction,
    onCloseAction,
  ]);

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onNavigateAction(categoryTasks[currentIndex - 1]);
    }
  }, [hasPrev, categoryTasks, currentIndex, onNavigateAction]);

  // Mood/exercise submit: save then close — entries are visible in the task list
  const handleExerciseSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      setLoading(true);
      try {
        await onCompleteAction(task.id, data);
        onCloseAction();
      } finally {
        setLoading(false);
      }
    },
    [onCompleteAction, task.id, onCloseAction],
  );

  const handleMoodSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      setLoading(true);
      try {
        await onCompleteAction(task.id, data);
        onCloseAction();
      } finally {
        setLoading(false);
      }
    },
    [onCompleteAction, task.id, onCloseAction],
  );

  const handleSaveReflection = useCallback(
    async (slug: string, text: string) => {
      const merged = { ...task.completionData, [slug]: text };
      await onCompleteAction(task.id, merged);
    },
    [onCompleteAction, task.id, task.completionData],
  );

  const content = task.content ?? EMPTY_CONTENT;
  const isRegistrySectioned =
    typeof task.body === "string" &&
    (task.taskType === "devotional" ||
      task.taskType === "info" ||
      task.taskType === "scripture_study");

  const programTask: ProgramTask | null = isRegistrySectioned
    ? {
        id: task.id,
        block: blockNumber,
        day: dayNumber,
        order: 0,
        category: task.category as ProgramTask["category"],
        type: task.taskType as ProgramTask["type"],
        name: task.name,
        passageRef: task.passageRef,
        scriptureRef: task.scriptureRef,
        inputs: task.inputs,
        body: task.body ?? "",
        filePath: "",
      }
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      {/* Header */}
      <div className="border-b border-zinc-100 bg-white px-4 sm:px-6 md:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-3 py-3">
          <button
            onClick={onCloseAction}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-zinc-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="flex-1 font-headline text-lg font-semibold truncate">{task.name}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 sm:px-6 md:px-8">
        <div className="mx-auto max-w-3xl">
          {isRegistrySectioned && programTask && (
            <SectionedContentRenderer
              task={programTask}
              locale={locale}
              completionData={task.completionData}
              onSaveReflectionAction={handleSaveReflection}
            />
          )}

          {task.taskType === "scripture_reading" && (
            <div className="space-y-6">
              <div>
                <p className="mb-3 font-headline text-lg font-bold text-foreground">
                  {(
                    content.prefetched_passage as {
                      reference: string;
                      content: string;
                    } | null
                  )?.reference ??
                    localizeScriptureRef((content.scripture_reference as string) ?? "", locale)}
                </p>
                <BilingualPassage
                  passage={
                    (content.prefetched_passage as {
                      reference: string;
                      content: string;
                    } | null) ?? null
                  }
                  locale={locale}
                />
              </div>
            </div>
          )}

          {task.taskType === "exercise" && (
            <ExerciseLogRenderer
              initialData={task.completionData}
              onSubmitAction={handleExerciseSubmit}
              loading={loading}
              openMode={mode}
            />
          )}

          {task.taskType === "mood_log" && (
            <MoodLogRenderer
              initialData={task.completionData}
              onSubmitAction={handleMoodSubmit}
              loading={loading}
              openMode={mode}
            />
          )}
        </div>
      </div>

      {/* Footer nav — only for non-mood/exercise tasks */}
      {task.taskType !== "mood_log" && task.taskType !== "exercise" && (
        <div className="fixed bottom-0 inset-x-0 z-50 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-3 py-5">
            {hasPrev ? (
              <button
                onClick={handlePrev}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 active:scale-95 transition-all"
                aria-label="Previous task"
              >
                <ArrowLeft size={20} className="text-foreground" />
              </button>
            ) : (
              <div className="h-9 w-9 shrink-0" />
            )}
            <div className="flex flex-1 flex-col items-center justify-center text-center leading-tight">
              <span className="text-sm font-semibold text-foreground">
                {t("blockLabel", { block: blockNumber })} | {t(task.category.toLowerCase())}
              </span>
              <span className="text-xs text-foreground/60">
                {t("dayLabel", { day: dayNumber })} | {currentIndex + 1} of {categoryTasks.length}
              </span>
            </div>
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              aria-label="Next task"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <ArrowRight size={20} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
