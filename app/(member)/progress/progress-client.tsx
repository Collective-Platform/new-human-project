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
  hasCompletion: boolean;
}

interface ProgressData {
  currentDay: number;
  selectedDay: number;
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

  // Initial load only
  useEffect(() => {
    let cancelled = false;
    async function init() {
      const res = await fetch("/api/progress");
      if (res.ok && !cancelled) {
        const d: ProgressData = await res.json();
        setData(d);
        setSelectedDay(d.currentDay);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

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
        dayLabel={t("dayLabel", { day: selectedDay ?? data.currentDay })}
      />

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
