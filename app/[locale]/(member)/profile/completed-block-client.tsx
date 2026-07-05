"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { DayCarousel } from "../progress/day-carousel";
import { TaskList } from "../progress/task-list";
import { TaskDetail } from "../progress/task-detail";
import type { ProgressPayload, DayContentTask, ProgressTask } from "@/src/features/progress";

function stripCompletion(t: ProgressTask): DayContentTask {
  const { completed: _c, completionData: _d, ...rest } = t;
  return rest;
}

function mergeWithCompletions(
  dayTasks: DayContentTask[],
  completions: Record<string, Record<string, unknown> | null>,
): ProgressTask[] {
  return dayTasks.map((t) => ({
    ...t,
    completed: t.id in completions,
    completionData: completions[t.id] ?? null,
  }));
}

export function CompletedBlockClient({
  locale,
  initialData,
}: {
  locale: string;
  initialData: ProgressPayload;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("progress");

  const [selectedDay, setSelectedDay] = useState(initialData.selectedDay);
  const [dayTasks, setDayTasks] = useState<DayContentTask[]>(() =>
    initialData.tasks.map(stripCompletion),
  );

  const [activeTask, setActiveTask] = useState<ProgressTask | null>(null);
  const [activeTaskMode, setActiveTaskMode] = useState<"add" | number>("add");

  const noop = async () => {};

  const dayCacheRef = useRef<Map<number, DayContentTask[]>>(
    new Map([[initialData.selectedDay, initialData.tasks.map(stripCompletion)]]),
  );
  const inFlightRef = useRef<Map<number, Promise<DayContentTask[] | null>>>(new Map());
  const completions = initialData.completions;

  async function loadDayContent(day: number): Promise<DayContentTask[] | null> {
    const cached = dayCacheRef.current.get(day);
    if (cached) return cached;
    const existing = inFlightRef.current.get(day);
    if (existing) return existing;

    const promise = (async () => {
      try {
        const res = await fetch(
          `/api/progress/day?day=${day}&locale=${locale}&block=${initialData.blockNumber}`,
        );
        if (!res.ok) return null;
        const data = (await res.json()) as { tasks: DayContentTask[] };
        dayCacheRef.current.set(day, data.tasks);
        return data.tasks;
      } finally {
        inFlightRef.current.delete(day);
      }
    })();
    inFlightRef.current.set(day, promise);
    return promise;
  }

  async function handleDaySelect(day: number) {
    setSelectedDay(day);
    const cached = dayCacheRef.current.get(day);
    if (cached) {
      setDayTasks(cached);
      return;
    }
    const content = await loadDayContent(day);
    if (content) setDayTasks(content);
  }

  const tasks = mergeWithCompletions(dayTasks, completions);

  const blockLabel =
    locale === "zh" ? `第${initialData.blockNumber}周期` : `Block ${initialData.blockNumber}`;

  function openTask(task: ProgressTask, mode: "add" | number) {
    setActiveTaskMode(mode);
    setActiveTask(task);
  }

  if (activeTask) {
    const current = tasks.find((t) => t.id === activeTask.id) ?? activeTask;
    const categoryTasks = tasks.filter((t) => t.category === current.category);
    return (
      <TaskDetail
        task={current}
        locale={locale}
        blockNumber={initialData.blockNumber}
        dayNumber={selectedDay}
        onCompleteAction={noop}
        onCloseAction={() => {
          setActiveTask(null);
          setActiveTaskMode("add");
        }}
        categoryTasks={categoryTasks}
        onNavigateAction={(t) => openTask(t, "add")}
        mode={activeTaskMode}
        readOnly
      />
    );
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 pt-4">
      <button
        onClick={() => router.push(`${pathname}?tab=completed`)}
        className="flex items-center gap-1 text-sm text-foreground/60 mb-5 hover:text-foreground transition-colors -ml-1"
      >
        <ChevronLeft className="w-4 h-4" />
        {locale === "zh" ? "返回" : "Back"}
      </button>

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-headline font-bold text-foreground">{blockLabel}</h2>
        <button
          onClick={() => router.push(`${pathname}?block=${initialData.blockNumber}&view=overview`)}
          className="flex items-center gap-1.5 px-3 py-1.5 hover:text-foreground active:scale-[0.97] transition-all"
        >
          <span className="text-[10px] font-medium capitalize tracking-wider text-foreground/60">
            {locale === "zh" ? "查看概览" : "View Overview"}
          </span>
        </button>
      </div>

      <DayCarousel
        days={initialData.carousel}
        selectedDay={selectedDay}
        onSelectAction={handleDaySelect}
        blockStartDate={initialData.blockStartDate}
        currentDay={25}
        locale={locale}
        todayLabel={t("today")}
      />

      <div className="mt-6 mb-2">
        <TaskList
          tasks={tasks}
          onTaskTapAction={(task) => openTask(task, "add")}
          onToggleCompleteAction={() => {}}
          onAddEntryAction={() => {}}
          onViewEntryAction={(task, entryIndex) => openTask(task, entryIndex)}
          labels={{
            mental: t("mental"),
            emotional: t("emotional"),
            physical: t("physical"),
          }}
          locked={true}
        />
      </div>
    </div>
  );
}
