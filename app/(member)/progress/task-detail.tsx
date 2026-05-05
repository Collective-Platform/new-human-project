"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getLocalizedString } from "@/src/features/content";
import { useNavVisibility } from "../nav-visibility";
import { DevotionalRenderer } from "./renderers/devotional";
import { ScriptureMemoriseRenderer } from "./renderers/scripture-memorise";
import { ScriptureStudyRenderer } from "./renderers/scripture-study";
import { MoodLogRenderer } from "./renderers/mood-log";
import { BilingualPassage } from "./renderers/bilingual-passage";

interface TaskData {
  id: string;
  category: string;
  taskType: string;
  name: string;
  content: Record<string, unknown> | null;
  completed: boolean;
  completionData: Record<string, unknown> | null;
}

const EMPTY_CONTENT: Record<string, unknown> = {};

export function TaskDetail({
  task,
  locale,
  blockNumber,
  dayNumber,
  onComplete,
  onClose,
  categoryTasks,
  onNavigate,
}: {
  task: TaskData;
  locale: string;
  blockNumber: number;
  dayNumber: number;
  onComplete: (taskId: string, data?: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
  categoryTasks: TaskData[];
  onNavigate: (task: TaskData) => void;
}) {
  const t = useTranslations("progress");
  const tm = useTranslations("mood");
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
    // Fire-and-forget: parent applies the optimistic completion patch
    // synchronously before awaiting the network. We navigate in the same
    // frame so the user sees the next task instantly. (Task 1.4)
    void onComplete(task.id);
    if (hasNext) {
      onNavigate(categoryTasks[currentIndex + 1]);
    } else {
      onClose();
    }
  }, [
    onComplete,
    task.id,
    hasNext,
    categoryTasks,
    currentIndex,
    onNavigate,
    onClose,
  ]);

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onNavigate(categoryTasks[currentIndex - 1]);
    }
  }, [hasPrev, categoryTasks, currentIndex, onNavigate]);

  const handleMoodSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      setLoading(true);
      try {
        await onComplete(task.id, data);
        if (hasNext) {
          onNavigate(categoryTasks[currentIndex + 1]);
        } else {
          onClose();
        }
      } finally {
        setLoading(false);
      }
    },
    [
      onComplete,
      task.id,
      hasNext,
      categoryTasks,
      currentIndex,
      onNavigate,
      onClose,
    ],
  );

  const content = task.content ?? EMPTY_CONTENT;

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-93.75 flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 bg-white">
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-zinc-100"
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back
          </span>
        </button>
        <h2 className="flex-1 font-headline text-base font-semibold truncate">
          {task.name}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {task.taskType === "devotional" && (
          <DevotionalRenderer
            passageRef={(content.passage_ref as string) ?? ""}
            focus={getLocalizedString(content.focus, locale)}
            readingNotes={getLocalizedString(content.reading_notes, locale)}
            keyIdea={getLocalizedString(content.key_idea, locale)}
            reflection={getLocalizedString(content.reflection, locale)}
            practice={getLocalizedString(content.practice, locale)}
          />
        )}

        {task.taskType === "scripture_reading" && (
          <div className="space-y-6">
            <div>
              <p className="mb-3 font-headline text-lg font-bold text-foreground">
                {(content.scripture_reference as string) ?? ""}
              </p>
              <BilingualPassage
                passage={
                  (content.prefetched_passage as {
                    reference: string;
                    content: string;
                  } | null) ?? null
                }
              />
            </div>
          </div>
        )}

        {task.taskType === "scripture_memorise" && (
          <ScriptureMemoriseRenderer
            reference={(content.memory_verse_reference as string) ?? ""}
            verseText={getLocalizedString(content.memory_verse_text, locale)}
          />
        )}

        {task.taskType === "scripture_study" && (
          <ScriptureStudyRenderer
            title={task.name}
            reference={(content.scripture_reference as string) ?? ""}
            passageText={getLocalizedString(content.scripture_text, locale)}
            prefetchedPassage={
              (content.prefetched_passage as {
                reference: string;
                content: string;
              } | null) ?? null
            }
            explanation={getLocalizedString(content.explanation, locale)}
            videoUrl={(content.video_url as string) ?? ""}
          />
        )}

        {task.taskType === "mood_log" && (
          <MoodLogRenderer
            completed={task.completed}
            initialData={task.completionData}
            onSubmit={handleMoodSubmit}
            loading={loading}
            labels={{
              pickEmoji: tm("pickEmoji"),
              terrible: tm("terrible"),
              bad: tm("bad"),
              okay: tm("okay"),
              good: tm("good"),
              excellent: tm("excellent"),
              influences: tm("influences"),
              family: tm("family"),
              friends: tm("friends"),
              love: tm("love"),
              work: tm("work"),
              school: tm("school"),
              health: tm("health"),
              moreContext: tm("moreContext"),
              submit: tm("submit"),
              completed: t("completed"),
              updateMood: tm("updateMood"),
            }}
          />
        )}
      </div>

      {/* Footer nav – sits where the bottom nav was, with divider and meta */}
      {task.taskType !== "mood_log" && (
        <div className="fixed bottom-0 inset-x-0 z-50 mx-auto flex max-w-93.75 items-center justify-between gap-3 border-t border-zinc-200 bg-white px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {hasPrev ? (
            <button
              onClick={handlePrev}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 active:scale-95 transition-all"
              aria-label="Previous task"
            >
              <span className="material-symbols-outlined text-[20px] text-foreground">
                arrow_back
              </span>
            </button>
          ) : (
            <div className="h-11 w-11 shrink-0" />
          )}
          <div className="flex flex-1 flex-col items-center justify-center text-center leading-tight">
            <span className="text-xs font-semibold text-foreground">
              {t("blockLabel", { block: blockNumber })} |{" "}
              {t(task.category.toLowerCase())}
            </span>
            <span className="text-[11px] text-foreground/60">
              {t("dayLabel", { day: dayNumber })} | {currentIndex + 1} of{" "}
              {categoryTasks.length}
            </span>
          </div>
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
            aria-label="Next task"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
