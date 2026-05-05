"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DayCarousel } from "./day-carousel";
import { TaskList } from "./task-list";
import { TaskDetail } from "./task-detail";
import type { ProgressPayload } from "@/src/features/progress";

type TaskData = ProgressPayload["tasks"][number];
type ProgressData = ProgressPayload;

export function ProgressClient({
  locale,
  initialData,
}: {
  locale: string;
  initialData: ProgressData;
}) {
  const t = useTranslations("progress");
  // Seeded from server-rendered payload — first paint shows real content,
  // no initial-load spinner. (Task 2.0 of tasks-perf-improvements.md)
  const [data, setData] = useState<ProgressData>(initialData);
  const [selectedDay, setSelectedDay] = useState<number>(
    initialData.selectedDay,
  );
  const [activeTask, setActiveTask] = useState<TaskData | null>(null);

  async function fetchDay(day: number) {
    const res = await fetch(`/api/progress?day=${day}`);
    if (res.ok) {
      const d: ProgressData = await res.json();
      setData(d);
    }
  }

  // Optimistically apply a patch to a single task in local state, then run
  // a fetch in the background. If the request fails, roll back to the
  // previous task snapshot. We never await fetchDay here — UI flips first,
  // server reconciles second. (Task 1.0 of tasks-perf-improvements.md)
  function applyTaskPatch(taskId: string, patch: Partial<TaskData>) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === taskId ? { ...t, ...patch } : t,
            ),
          }
        : prev,
    );
  }

  async function handleComplete(
    taskId: string,
    taskData?: Record<string, unknown>,
  ) {
    const previous = data.tasks.find((t) => t.id === taskId);
    if (!previous) return;

    // Optimistic: mark complete immediately so Next/checkbox feel instant.
    applyTaskPatch(taskId, {
      completed: true,
      completionData: taskData ?? previous.completionData,
    });

    // Background write — no await, no full-day refetch.
    try {
      const res = await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, data: taskData }),
      });
      if (!res.ok) {
        // Rollback to the snapshot we captured before flipping.
        applyTaskPatch(taskId, {
          completed: previous.completed,
          completionData: previous.completionData,
        });
      }
    } catch {
      applyTaskPatch(taskId, {
        completed: previous.completed,
        completionData: previous.completionData,
      });
    }
  }

  async function handleToggleComplete(taskId: string) {
    const previous = data.tasks.find((t) => t.id === taskId);
    if (!previous) return;

    const nextCompleted = !previous.completed;
    const url = previous.completed
      ? "/api/tasks/uncomplete"
      : "/api/tasks/complete";

    // Optimistic flip: checkbox updates within the same frame as the tap.
    applyTaskPatch(taskId, { completed: nextCompleted });

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (!res.ok) {
        applyTaskPatch(taskId, { completed: previous.completed });
      }
    } catch {
      applyTaskPatch(taskId, { completed: previous.completed });
    }
  }

  async function handleDaySelect(day: number) {
    setSelectedDay(day);
    setActiveTask(null);
    await fetchDay(day);
  }

  if (activeTask) {
    // Find the latest version of the task from data (with updated completed state)
    const current =
      data.tasks.find((t) => t.id === activeTask.id) ?? activeTask;
    const categoryTasks = data.tasks.filter(
      (t) => t.category === current.category,
    );
    return (
      <TaskDetail
        task={current}
        locale={locale}
        blockNumber={data.blockNumber}
        dayNumber={selectedDay}
        onComplete={handleComplete}
        onClose={() => {
          // No refetch on close — local optimistic state already reflects
          // the latest completion status. (Task 1.5 of perf improvements)
          setActiveTask(null);
        }}
        categoryTasks={categoryTasks}
        onNavigate={(t) => setActiveTask(t)}
      />
    );
  }

  return (
    <div className="px-4 pt-4">
      <DayCarousel
        days={data.carousel}
        selectedDay={selectedDay}
        onSelect={handleDaySelect}
        blockStartDate={data.blockStartDate}
        currentDay={data.currentDay}
      />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground font-['Plus_Jakarta_Sans']">
          {t("dayLabel", { day: selectedDay })} of 25
        </h2>
        {data.missedDays > 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-foreground/80 backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
              {data.missedDays} missed {data.missedDays === 1 ? "day" : "days"}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-foreground/80 backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
              On Track!
            </span>
          </div>
        )}
      </div>

      <TaskList
        tasks={data.tasks}
        onTaskTap={setActiveTask}
        onToggleComplete={handleToggleComplete}
        labels={{
          mental: t("mental"),
          emotional: t("emotional"),
          physical: t("physical"),
        }}
      />
    </div>
  );
}
