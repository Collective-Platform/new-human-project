"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { getLocalizedString } from "@/src/features/content";
import { ScriptureMemoriseRenderer } from "./renderers/scripture-memorise";
import { ScriptureStudyRenderer } from "./renderers/scripture-study";
import { MoodLogRenderer } from "./renderers/mood-log";
import { ExerciseRenderer } from "./renderers/exercise";

interface TaskData {
  id: string;
  category: string;
  taskType: string;
  name: string;
  content: Record<string, unknown> | null;
  completed: boolean;
}

export function TaskDetail({
  task,
  locale,
  onComplete,
  onClose,
}: {
  task: TaskData;
  locale: string;
  onComplete: (taskId: string, data?: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("progress");
  const tm = useTranslations("mood");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(task.completed);

  const handleDone = useCallback(
    async (data?: Record<string, unknown>) => {
      if (completed) return;
      setLoading(true);
      try {
        await onComplete(task.id, data);
        setCompleted(true);
      } finally {
        setLoading(false);
      }
    },
    [completed, onComplete, task.id]
  );

  const content = task.content ?? {};

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
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
      <div className="flex-1 overflow-y-auto p-4">
        {task.taskType === "scripture_memorise" && (
          <ScriptureMemoriseRenderer
            reference={
              (content.memory_verse_reference as string) ?? ""
            }
            verseText={getLocalizedString(
              content.memory_verse_text,
              locale
            )}
            completed={completed}
            onDone={() => handleDone()}
            loading={loading}
            doneLabel={t("done")}
            completedLabel={t("completed")}
          />
        )}

        {task.taskType === "scripture_study" && (
          <ScriptureStudyRenderer
            reference={
              (content.scripture_reference as string) ?? ""
            }
            passageText={getLocalizedString(
              content.scripture_text,
              locale
            )}
            explanation={getLocalizedString(
              content.explanation,
              locale
            )}
            videoUrl={(content.video_url as string) ?? ""}
            completed={completed}
            onDone={() => handleDone()}
            loading={loading}
            doneLabel={t("done")}
            completedLabel={t("completed")}
          />
        )}

        {task.taskType === "mood_log" && (
          <MoodLogRenderer
            completed={completed}
            onSubmit={(data) => handleDone(data)}
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
            }}
          />
        )}

        {task.taskType === "exercise" && (
          <ExerciseRenderer
            completed={completed}
            onToggle={() => handleDone()}
            loading={loading}
            label={task.name}
            completedLabel={t("completed")}
          />
        )}
      </div>
    </div>
  );
}
