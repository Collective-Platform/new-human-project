"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { getLocalizedString } from "@/src/features/content";
import { DevotionalRenderer } from "./renderers/devotional";
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
  completionData: Record<string, unknown> | null;
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
      setLoading(true);
      try {
        await onComplete(task.id, data);
        setCompleted(true);
      } finally {
        setLoading(false);
      }
    },
    [onComplete, task.id]
  );

  const content = task.content ?? {};

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-3xl flex-col bg-surface">
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
        {task.taskType === "devotional" && (
          <DevotionalRenderer
            passageRef={(content.passage_ref as string) ?? ""}
            focus={getLocalizedString(content.focus, locale)}
            readingNotes={getLocalizedString(content.reading_notes, locale)}
            keyIdea={getLocalizedString(content.key_idea, locale)}
            reflection={getLocalizedString(content.reflection, locale)}
            practice={getLocalizedString(content.practice, locale)}
            completed={completed}
            onDone={() => handleDone()}
            loading={loading}
            doneLabel={t("done")}
            completedLabel={t("completed")}
          />
        )}

        {task.taskType === "scripture_reading" && (
          <div className="space-y-6">
            <div>
              <p className="mb-3 font-headline text-lg font-bold text-foreground">
                {(content.scripture_reference as string) ?? ""}
              </p>
              <p className="text-sm text-foreground/60">
                Read this passage in your Bible or Bible app.
              </p>
            </div>
            <button
              onClick={() => handleDone()}
              disabled={completed || loading}
              className={`w-full rounded-md py-3 text-sm font-semibold transition-opacity ${
                completed
                  ? "bg-green-100 text-green-700"
                  : "bg-primary text-white hover:opacity-90"
              } disabled:opacity-60`}
            >
              {completed ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  {t("completed")}
                </span>
              ) : loading ? (
                "…"
              ) : (
                t("done")
              )}
            </button>
          </div>
        )}

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
            initialData={task.completionData}
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
              updateMood: tm("updateMood"),
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
