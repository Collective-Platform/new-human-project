"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { DayCarousel } from "./day-carousel";
import { TaskList } from "./task-list";
import { TaskDetail } from "./task-detail";
import type { ProgressPayload, ProgressTask, DayContentTask } from "@/src/features/progress";
import { useProgressContext } from "@/src/features/progress/progress-context";

type TaskData = ProgressTask;

function computeLocalCurrentDay(blockStartDate: string): number {
  const msPerDay = 86_400_000;
  const now = new Date();
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(blockStartDate);
  const startMs = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  return Math.min(Math.max(Math.floor((todayMs - startMs) / msPerDay) + 1, 1), 25);
}

function toChineseNumeral(n: number): string {
  const ones = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (n <= 9) return ones[n];
  if (n === 10) return "十";
  if (n < 20) return "十" + ones[n % 10];
  if (n === 20) return "二十";
  return "二十" + ones[n % 10];
}

function stripCompletion(t: ProgressTask): DayContentTask {
  const { completed: _c, completionData: _d, ...rest } = t;
  return rest;
}

function mergedTasks(
  dayTasks: DayContentTask[],
  completions: Record<string, Record<string, unknown> | null>,
): ProgressTask[] {
  return dayTasks.map((t) => ({
    ...t,
    completed: t.id in completions,
    completionData: completions[t.id] ?? null,
  }));
}

export function ProgressClient({
  locale,
  initialData,
  initialTaskId,
}: {
  locale: string;
  initialData: ProgressPayload;
  initialTaskId?: string;
}) {
  const pathname = usePathname();
  const t = useTranslations("progress");
  const ctx = useProgressContext();

  const [locked, setLocked] = useState(false);

  // Restore to the day the user was on before navigating away. ctx.state is
  // already set on soft navigation back (layout provider persists). Fall back
  // to the SSR-provided selectedDay on first load / hard reload.
  const [selectedDay, setSelectedDay] = useState<number>(
    ctx.state?.selectedDay ?? initialData.selectedDay,
  );

  // Day content only — no completion state. Merged with context at render time.
  // On soft navigation back, ctx.state.selectedDay may differ from initialData
  // (user had navigated to a different day). The restore effect below fetches
  // the correct day's content if needed.
  const [dayTasks, setDayTasks] = useState<DayContentTask[]>(() =>
    initialData.tasks.map(stripCompletion),
  );

  const [activeTask, setActiveTask] = useState<TaskData | null>(null);
  const [activeTaskMode, setActiveTaskMode] = useState<"add" | number>("add");

  // Static day content cache: day → DayContentTask[].
  // Content never changes so cache entries never need invalidation.
  const dayCacheRef = useRef<Map<number, DayContentTask[]>>(
    new Map([[initialData.selectedDay, initialData.tasks.map(stripCompletion)]]),
  );
  const inFlightRef = useRef<Map<number, Promise<DayContentTask[] | null>>>(new Map());
  const taskNavStack = useRef<Array<{ task: TaskData; mode: "add" | number }>>([]);
  const skipNextPopRef = useRef(false);
  const initialTaskIdRef = useRef(initialTaskId);

  // Full completion map across ALL days from SSR. Used as the fallback before the
  // context is initialized (first paint / hard reload). Must be the complete map,
  // not just the selected day's tasks — otherwise other days render as unchecked.
  const initialCompletions = useRef(initialData.completions);

  // Initialize the context from SSR data. The provider's initializedRef means
  // this is a no-op on soft navigation back (context already has correct state).
  useEffect(() => {
    ctx.initialize({
      blockNumber: initialData.blockNumber,
      blockStartDate: initialData.blockStartDate,
      currentDay: computeLocalCurrentDay(initialData.blockStartDate),
      selectedDay: initialData.selectedDay,
      missedDays: initialData.missedDays,
      carousel: initialData.carousel,
      completions: initialCompletions.current,
      taskIdsByDay: initialData.taskIdsByDay,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only

  // On soft navigation back, ctx.state.selectedDay may differ from the SSR
  // initialData (user was on a different day when they left). Fetch that day's
  // content so the task list matches the restored carousel selection.
  useEffect(() => {
    const restoredDay = ctx.state?.selectedDay;
    if (!restoredDay || restoredDay === initialData.selectedDay) return;
    const cached = dayCacheRef.current.get(restoredDay);
    if (cached) {
      setDayTasks(cached);
      return;
    }
    void loadDayContent(restoredDay).then((content) => {
      if (content) setDayTasks(content);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only — ctx.state is synchronously available on soft nav back

  // Open deep-linked task. Runs once state is ready; no-op after initialTaskId is cleared.
  useEffect(() => {
    if (!initialTaskIdRef.current) return;
    const completions = ctx.state?.completions ?? initialCompletions.current;
    const tasks = mergedTasks(dayTasks, completions);
    const task = tasks.find((t) => t.id === initialTaskIdRef.current);
    if (task) {
      handleTaskTap(task);
      initialTaskIdRef.current = undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.state]); // fires once ctx.state becomes non-null (or immediately if already set)

  // Advance currentDay at the user's local midnight so the "Today" label updates.
  useEffect(() => {
    const now = new Date();
    const nextLocalMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(() => {
      ctx.updateCurrentDay(computeLocalCurrentDay(initialData.blockStartDate));
    }, nextLocalMidnight.getTime() - now.getTime());
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only

  // Warm immediate neighbors after hydration.
  useEffect(() => {
    const neighbors = [initialData.currentDay - 1, initialData.currentDay + 1].filter(
      (d) => d >= 1 && d <= 25,
    );
    const idle =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? (window as Window).requestIdleCallback
        : null;
    const handle =
      idle != null
        ? idle(() => neighbors.forEach(prefetchDay))
        : window.setTimeout(() => neighbors.forEach(prefetchDay), 200);
    return () => {
      if (idle != null && "cancelIdleCallback" in window) {
        (window as Window).cancelIdleCallback(handle as number);
      } else {
        clearTimeout(handle as number);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onPopState() {
      if (skipNextPopRef.current) {
        skipNextPopRef.current = false;
        return;
      }
      taskNavStack.current.pop();
      const prev = taskNavStack.current[taskNavStack.current.length - 1];
      if (prev) {
        setActiveTask(prev.task);
        setActiveTaskMode(prev.mode);
      } else {
        setActiveTask(null);
        setActiveTaskMode("add");
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // --- Content fetching ---

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

  function prefetchDay(day: number) {
    if (dayCacheRef.current.has(day) || inFlightRef.current.has(day)) return;
    void loadDayContent(day);
  }

  // --- Handlers ---

  async function handleDaySelect(day: number) {
    setSelectedDay(day);
    ctx.updateSelectedDay(day);
    setActiveTask(null);
    window.history.replaceState(null, "", `${pathname}?day=${day}`);

    const cached = dayCacheRef.current.get(day);
    if (cached) {
      setDayTasks(cached);
      return;
    }
    const content = await loadDayContent(day);
    if (content) setDayTasks(content);
  }

  async function handleComplete(taskId: string, taskData?: Record<string, unknown>) {
    if (locked) return;
    await ctx.markComplete(taskId, taskData);
  }

  async function handleToggleComplete(taskId: string) {
    if (locked) return;
    const completions = ctx.state?.completions ?? initialCompletions.current;
    if (taskId in completions) {
      await ctx.markIncomplete(taskId);
    } else {
      await ctx.markComplete(taskId);
    }
  }

  function handleTaskTap(task: TaskData) {
    if (locked) return;
    taskNavStack.current.push({ task, mode: "add" });
    window.history.pushState({ taskNav: true }, "");
    setActiveTaskMode("add");
    setActiveTask(task);
  }

  function handleAddEntry(task: TaskData) {
    if (locked) return;
    taskNavStack.current.push({ task, mode: "add" });
    window.history.pushState({ taskNav: true }, "");
    setActiveTaskMode("add");
    setActiveTask(task);
  }

  function handleViewEntry(task: TaskData, entryIndex: number) {
    taskNavStack.current.push({ task, mode: entryIndex });
    window.history.pushState({ taskNav: true }, "");
    setActiveTaskMode(entryIndex);
    setActiveTask(task);
  }

  // Derive rendered state: context when available, SSR fallback on first paint.
  // On soft navigation back, ctx.state is already set (layout provider persists).
  // On first load, ctx.state is null until the mount effect fires; SSR data fills in.
  const completions = ctx.state?.completions ?? initialCompletions.current;
  const carousel = ctx.state?.carousel ?? initialData.carousel;
  const missedDays = ctx.state?.missedDays ?? initialData.missedDays;
  const currentDay = ctx.state?.currentDay ?? initialData.currentDay;

  const tasks = mergedTasks(dayTasks, completions);

  if (activeTask) {
    const current = tasks.find((t) => t.id === activeTask.id) ?? activeTask;
    const categoryTasks = tasks.filter((t) => t.category === current.category);
    return (
      <TaskDetail
        task={current}
        locale={locale}
        blockNumber={initialData.blockNumber}
        dayNumber={selectedDay}
        onCompleteAction={handleComplete}
        onCloseAction={() => {
          const depth = taskNavStack.current.length;
          taskNavStack.current = [];
          setActiveTask(null);
          setActiveTaskMode("add");
          if (depth > 0) {
            skipNextPopRef.current = true;
            window.history.go(-depth);
          }
        }}
        categoryTasks={categoryTasks}
        onNavigateAction={(t) => {
          taskNavStack.current.push({ task: t, mode: "add" });
          window.history.pushState({ taskNav: true }, "");
          setActiveTaskMode("add");
          setActiveTask(t);
        }}
        mode={activeTaskMode}
      />
    );
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 pt-4 pb-8">
      <DayCarousel
        days={carousel}
        selectedDay={selectedDay}
        onSelectAction={handleDaySelect}
        onPrefetchAction={prefetchDay}
        blockStartDate={initialData.blockStartDate}
        currentDay={currentDay}
        locale={locale}
        todayLabel={t("today")}
      />

      <div className="flex items-center justify-between mt-6 mb-6">
        <h2 className="text-2xl font-headline font-bold text-foreground">
          {locale === "zh"
            ? t("dayLabel", { day: toChineseNumeral(selectedDay) })
            : t("dayLabel", { day: selectedDay })}
        </h2>
        {missedDays > 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-foreground/80 backdrop-blur-sm">
            <span className="text-[10px] font-medium uppercase tracking-wider text-foreground">
              {t("missedDays", { count: missedDays })}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-foreground/80 backdrop-blur-sm">
            <span className="text-[10px] font-medium uppercase tracking-wider text-foreground">
              {t("onTrack")}
            </span>
          </div>
        )}
      </div>

      <TaskList
        tasks={tasks}
        onTaskTapAction={handleTaskTap}
        onToggleCompleteAction={handleToggleComplete}
        onAddEntryAction={handleAddEntry}
        onViewEntryAction={handleViewEntry}
        labels={{
          mental: t("mental"),
          emotional: t("emotional"),
          physical: t("physical"),
        }}
        locked={locked}
      />
    </div>
  );
}
