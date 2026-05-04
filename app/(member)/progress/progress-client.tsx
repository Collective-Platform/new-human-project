"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { DayCarousel } from "./day-carousel";
import { TaskList } from "./task-list";
import { TaskDetail } from "./task-detail";

interface TaskData {
  id: string;
  category: string;
  taskType: string;
  name: string;
  content: Record<string, unknown> | null;
  completed: boolean;
  completionData: Record<string, unknown> | null;
}

interface CarouselDay {
  day: number;
  reachable: boolean;
  fullyCompleted: boolean;
}

interface ProgressData {
  blockNumber: number;
  currentDay: number;
  selectedDay: number;
  blockStartDate: string;
  missedDays: number;
  carousel: CarouselDay[];
  tasks: TaskData[];
}

export function ProgressClient({ locale }: { locale: string }) {
  const t = useTranslations("progress");
  const [data, setData] = useState<ProgressData | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeTask, setActiveTask] = useState<TaskData | null>(null);

  async function fetchDay(day: number) {
    const res = await fetch(`/api/progress?day=${day}`);
    if (res.ok) {
      const d: ProgressData = await res.json();
      setData(d);
    }
  }

  // Initial load (and re-load when locale changes so prefetched
  // scripture passages match the active language)
  useEffect(() => {
    let cancelled = false;
    async function init() {
      const day = selectedDay !== null ? `?day=${selectedDay}` : "";
      const res = await fetch(`/api/progress${day}`);
      if (res.ok && !cancelled) {
        const d: ProgressData = await res.json();
        setData(d);
        if (selectedDay === null) setSelectedDay(d.currentDay);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  async function handleComplete(
    taskId: string,
    taskData?: Record<string, unknown>,
  ) {
    const res = await fetch("/api/tasks/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, data: taskData }),
    });

    if (res.ok && selectedDay !== null) {
      await fetchDay(selectedDay);
    }
  }

  async function handleToggleComplete(taskId: string) {
    const task = data?.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const url = task.completed
      ? "/api/tasks/uncomplete"
      : "/api/tasks/complete";

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    });

    if (res.ok && selectedDay !== null) {
      await fetchDay(selectedDay);
    }
  }

  async function handleDaySelect(day: number) {
    setSelectedDay(day);
    setActiveTask(null);
    await fetchDay(day);
  }

  if (!data) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
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
        dayNumber={selectedDay ?? data.currentDay}
        onComplete={handleComplete}
        onClose={() => {
          setActiveTask(null);
          if (selectedDay !== null) fetchDay(selectedDay);
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
        selectedDay={selectedDay ?? data.currentDay}
        onSelect={handleDaySelect}
        blockStartDate={data.blockStartDate}
        currentDay={data.currentDay}
      />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground font-['Plus_Jakarta_Sans']">
          {t("dayLabel", { day: selectedDay ?? data.currentDay })} of 25
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
