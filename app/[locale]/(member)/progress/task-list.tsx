"use client";

import { useTranslations } from "next-intl";
import {
  BookOpenText,
  Smile,
  SportShoe,
  CheckCircle,
  Circle,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { MOOD_EMOJI_MAP, normalizeEntries } from "./renderers/mood-log";
import {
  SPORT_EMOJIS,
  normalizeExerciseEntries,
  formatDuration,
} from "./renderers/exercise-log";

interface TaskItem {
  id: string;
  category: string;
  taskType: string;
  name: string;
  content: Record<string, unknown> | null;
  completed: boolean;
  completionData: Record<string, unknown> | null;
}

const categoryConfig: Record<string, { iconBg: string; iconColor: string; Icon: LucideIcon }> = {
  Mental: {
    iconBg: "bg-[#ffaca3]",
    iconColor: "text-[#c10014]",
    Icon: BookOpenText,
  },
  Emotional: {
    iconBg: "bg-[#d7e2ff]",
    iconColor: "text-[#135db9]",
    Icon: Smile,
  },
  Physical: {
    iconBg: "bg-[#fef6e3]",
    iconColor: "text-[#645f50]",
    Icon: SportShoe,
  },
};

export function TaskList({
  tasks,
  onTaskTap,
  onToggleComplete,
  onAddEntry,
  onViewEntry,
  labels,
}: {
  tasks: TaskItem[];
  onTaskTap: (task: TaskItem) => void;
  onToggleComplete: (taskId: string) => void;
  onAddEntry: (task: TaskItem) => void;
  onViewEntry: (task: TaskItem, entryIndex: number) => void;
  labels: { mental: string; emotional: string; physical: string };
}) {
  const te = useTranslations("exercise");
  const tm = useTranslations("mood");

  const sportLabels: Record<string, string> = {
    run: te("run"),
    badminton: te("badminton"),
    pickleball: te("pickleball"),
    swimming: te("swimming"),
    pilates: te("pilates"),
    others: te("others"),
  };

  const influenceLabels: Record<string, string> = {
    family: tm("family"),
    friends: tm("friends"),
    love: tm("love"),
    work: tm("work"),
    school: tm("school"),
    health: tm("health"),
  };

  const categories = ["Mental", "Emotional", "Physical"] as const;
  const labelMap: Record<string, string> = {
    Mental: labels.mental,
    Emotional: labels.emotional,
    Physical: labels.physical,
  };

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const catTasks = tasks.filter((t) => t.category === cat);
        const config = categoryConfig[cat];
        const CategoryIcon = config.Icon;

        return (
          <section key={cat} className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${config.iconBg} ${config.iconColor}`}
              >
                <CategoryIcon size={20} />
              </div>
              <h3 className="text-xl font-bold font-headline text-foreground">{labelMap[cat]}</h3>
            </div>

            {/* Main card — all task rows and entry rows, no add rows */}
            <div className="rounded-3xl bg-white shadow-card overflow-hidden">
              {catTasks.map((task, taskIdx) => {
                const isExercise = task.taskType === "exercise";
                const isMoodLog = task.taskType === "mood_log";

                const moodEntries = isMoodLog ? normalizeEntries(task.completionData) : [];
                const exerciseEntries = isExercise
                  ? normalizeExerciseEntries(task.completionData)
                  : [];
                const nonRestEntries = exerciseEntries.filter((e) => e.sportKey !== "rest");
                const isRestCompletion =
                  exerciseEntries.length > 0 && nonRestEntries.length === 0;

                const showEntryRows =
                  task.completed &&
                  (isMoodLog ? moodEntries.length > 0 : exerciseEntries.length > 0);

                const isFirst = taskIdx === 0;

                if (showEntryRows) {
                  return (
                    <div key={task.id} className={isFirst ? "" : "border-t border-zinc-50"}>
                      {isMoodLog &&
                        moodEntries.map((entry, i) => {
                          const emojis = entry.moods.map((m) => MOOD_EMOJI_MAP[m] ?? "").join(" ");
                          const preview =
                            entry.influences.length > 0
                              ? entry.influences.map((k) => influenceLabels[k] ?? k).join(", ")
                              : entry.context.trim().slice(0, 40) || null;
                          const entryLabel = preview ? `${emojis} · ${preview}` : emojis;
                          return (
                            <div key={i} className={i === 0 ? "" : "border-t border-zinc-50"}>
                              <div className="flex w-full items-center gap-3 px-5 py-3.5">
                                <CheckCircle size={20} className="text-primary shrink-0" />
                                <button
                                  onClick={() => onViewEntry(task, i)}
                                  className="flex flex-1 items-center text-left transition-colors hover:opacity-70"
                                >
                                  <span className="flex-1 truncate text-sm text-foreground/50">
                                    {entryLabel}
                                  </span>
                                  <ChevronRight size={18} className="text-zinc-400 shrink-0" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                      {isExercise &&
                        (isRestCompletion ? (
                          <div className="flex w-full items-center gap-3 px-5 py-3.5">
                            <CheckCircle size={20} className="text-primary shrink-0" />
                            <span className="flex-1 text-sm text-foreground/50">
                              {SPORT_EMOJIS.rest} {te("rested")}
                            </span>
                          </div>
                        ) : (
                          nonRestEntries.map((entry, i) => {
                            const emoji = SPORT_EMOJIS[entry.sportKey] ?? "";
                            const sportName =
                              entry.sportKey === "others"
                                ? (entry.customSport ?? sportLabels.others)
                                : (sportLabels[entry.sportKey] ?? entry.sportKey);
                            const duration = formatDuration(entry.hours, entry.minutes);
                            const entryLabel = duration
                              ? `${emoji} ${sportName} · ${duration}`
                              : `${emoji} ${sportName}`;
                            return (
                              <div key={i} className={i === 0 ? "" : "border-t border-zinc-50"}>
                                <div className="flex w-full items-center gap-3 px-5 py-3.5">
                                  <CheckCircle size={20} className="text-primary shrink-0" />
                                  <button
                                    onClick={() => onViewEntry(task, i)}
                                    className="flex flex-1 items-center text-left transition-colors hover:opacity-70"
                                  >
                                    <span className="flex-1 text-sm text-foreground/50">
                                      {entryLabel}
                                    </span>
                                    <ChevronRight size={18} className="text-zinc-400 shrink-0" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ))}
                    </div>
                  );
                }

                // Standard task row
                return (
                  <div key={task.id} className={isFirst ? "" : "border-t border-zinc-50"}>
                    <div className="flex w-full items-center gap-3 px-5 py-3.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isMoodLog || isExercise) {
                            onTaskTap(task);
                          } else {
                            onToggleComplete(task.id);
                          }
                        }}
                        className="shrink-0 flex items-center justify-center transition-transform active:scale-90"
                        aria-label={
                          isMoodLog || isExercise
                            ? `Open ${isMoodLog ? "mood log" : "exercise log"}`
                            : task.completed
                              ? "Mark incomplete"
                              : "Mark complete"
                        }
                      >
                        {task.completed ? (
                          <CheckCircle size={20} className="text-primary" />
                        ) : (
                          <Circle
                            size={20}
                            className="text-zinc-300 hover:text-primary/80 transition-colors"
                          />
                        )}
                      </button>
                      <button
                        onClick={() => onTaskTap(task)}
                        className="flex flex-1 items-center text-left transition-colors hover:opacity-70"
                      >
                        <span
                          className={`flex-1 text-sm font-normal ${task.completed ? "text-foreground/50" : "text-foreground"}`}
                        >
                          {task.name}
                        </span>
                        <ChevronRight size={18} className="text-zinc-400 shrink-0" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Separate add pills — one per task that has entries (not rest-only) */}
            {catTasks.map((task) => {
              const isMoodLog = task.taskType === "mood_log";
              const isExercise = task.taskType === "exercise";
              if (!task.completed) return null;

              const moodEntries = isMoodLog ? normalizeEntries(task.completionData) : [];
              const exerciseEntries = isExercise
                ? normalizeExerciseEntries(task.completionData)
                : [];
              const nonRestEntries = exerciseEntries.filter((e) => e.sportKey !== "rest");
              const isRestCompletion =
                exerciseEntries.length > 0 && nonRestEntries.length === 0;
              const hasEntries = isMoodLog
                ? moodEntries.length > 0
                : exerciseEntries.length > 0;

              if (!hasEntries || isRestCompletion) return null;

              return (
                <button
                  key={`${task.id}-add`}
                  onClick={() => onAddEntry(task)}
                  className="w-full rounded-full border-2 border-dashed border-zinc-200 py-2 text-xs font-semibold text-foreground/40 transition-all hover:border-primary/30 hover:text-primary active:scale-[0.99]"
                >
                  + {isMoodLog ? tm("addMoodLog") : te("addExercise")}
                </button>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
