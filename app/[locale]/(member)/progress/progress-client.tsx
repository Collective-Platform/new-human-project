"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DayCarousel } from "./day-carousel";
import { TaskList } from "./task-list";
import { TaskDetail } from "./task-detail";
import type { ProgressPayload } from "@/src/features/progress";
import { completeTask, uncompleteTask } from "@/src/features/tasks/actions";

type TaskData = ProgressPayload["tasks"][number];
type ProgressData = ProgressPayload;

function toChineseNumeral(n: number): string {
  const ones = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (n <= 9) return ones[n];
  if (n === 10) return "十";
  if (n < 20) return "十" + ones[n % 10];
  if (n === 20) return "二十";
  return "二十" + ones[n % 10];
}

export function ProgressClient({
  locale,
  initialData,
}: {
  locale: string;
  initialData: ProgressData;
}) {
  const router = useRouter();
  const t = useTranslations("progress");
  // Seeded from server-rendered payload — first paint shows real content,
  // no initial-load spinner. (Task 2.0 of tasks-perf-improvements.md)
  const [data, setData] = useState<ProgressData>(initialData);
  const [selectedDay, setSelectedDay] = useState<number>(initialData.selectedDay);
  const [activeTask, setActiveTask] = useState<TaskData | null>(null);

  // Intent-based prefetch cache for day data. (Task 3.0)
  // Hovering / touching a day chip warms this cache so the subsequent
  // tap can resolve from memory instead of waiting on a round-trip.
  // This is intentionally a small ad-hoc cache that will be replaced
  // by TanStack Query in Task 4.0 — keep the surface minimal.
  const dayCacheRef = useRef<Map<number, ProgressData>>(
    new Map([[initialData.selectedDay, initialData]]),
  );
  const inFlightRef = useRef<Map<number, Promise<ProgressData | null>>>(new Map());

  async function loadDay(day: number): Promise<ProgressData | null> {
    const cached = dayCacheRef.current.get(day);
    if (cached) return cached;

    const existing = inFlightRef.current.get(day);
    if (existing) return existing;

    const promise = (async () => {
      try {
        const res = await fetch(`/api/progress?day=${day}&locale=${locale}`, {
          cache: "no-store",
        });
        if (!res.ok) return null;
        const d: ProgressData = await res.json();
        dayCacheRef.current.set(day, d);
        return d;
      } finally {
        inFlightRef.current.delete(day);
      }
    })();
    inFlightRef.current.set(day, promise);
    return promise;
  }

  // Fire-and-forget warm-up — no UI change, just primes the cache.
  function prefetchDay(day: number) {
    if (dayCacheRef.current.has(day) || inFlightRef.current.has(day)) return;
    void loadDay(day);
  }

  async function fetchDay(day: number) {
    const d = await loadDay(day);
    if (d) setData((prev) => ({ ...d, currentDay: prev.currentDay }));
  }

  // Warm the immediate neighbors of the current day on mount so the most
  // common "peek at yesterday/tomorrow" path is instant. Runs once after
  // hydration via requestIdleCallback so it doesn't compete with paint.
  // Bounded to [1, 25] and skips the already-cached current day. (Task 3.0)
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
    // Mount-only; prefetchDay is stable (only writes to refs).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optimistically apply a patch to a single task in local state, then run
  // a fetch in the background. If the request fails, roll back to the
  // previous task snapshot. We never await fetchDay here — UI flips first,
  // server reconciles second. (Task 1.0 of tasks-perf-improvements.md)
  // Also patches the prefetch cache (Task 3.0) so navigating away and back
  // doesn't restore stale completion state from the cache.
  function applyTaskPatch(taskId: string, patch: Partial<TaskData>) {
    setData((prev) => {
      const newTasks = prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        // Merge completionData rather than overwrite so concurrent autosaves
        // (practice + reflection firing in the same debounce window) accumulate
        // both fields. The updater form of setData applies patches sequentially,
        // so the second patch sees the first patch's output as `t.completionData`.
        const completionData =
          patch.completionData !== undefined
            ? { ...t.completionData, ...patch.completionData }
            : t.completionData;
        return { ...t, ...patch, completionData };
      });
      const allDone = newTasks.every((t) => t.completed);
      return {
        ...prev,
        tasks: newTasks,
        carousel: prev.carousel.map((c) =>
          c.day === selectedDay ? { ...c, fullyCompleted: allDone } : c,
        ),
      };
    });
    const cached = dayCacheRef.current.get(selectedDay);
    if (cached) {
      const newCachedTasks = cached.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const completionData =
          patch.completionData !== undefined
            ? { ...t.completionData, ...patch.completionData }
            : t.completionData;
        return { ...t, ...patch, completionData };
      });
      const allDone = newCachedTasks.every((t) => t.completed);
      dayCacheRef.current.set(selectedDay, {
        ...cached,
        tasks: newCachedTasks,
        carousel: cached.carousel.map((c) =>
          c.day === selectedDay ? { ...c, fullyCompleted: allDone } : c,
        ),
      });
    }
  }

  // After a successful completion mutation, all other days' cached payloads
  // have a stale carousel (their fullyCompleted snapshot predates this change).
  // Drop them so the next navigation fetches a fresh payload from the server.
  function evictOtherDayCache() {
    for (const day of Array.from(dayCacheRef.current.keys())) {
      if (day !== selectedDay) dayCacheRef.current.delete(day);
    }
  }

  async function handleComplete(taskId: string, taskData?: Record<string, unknown>) {
    const previous = data.tasks.find((t) => t.id === taskId);
    if (!previous) return;

    // Optimistic: mark complete immediately so Next/checkbox feel instant.
    applyTaskPatch(taskId, {
      completed: true,
      completionData: taskData ?? previous.completionData,
    });

    // Background write — no await, no full-day refetch. When Next is clicked
    // after reflection autosave, preserve the existing completion data
    // instead of sending undefined and overwriting the row with `{}`.
    const completionData = taskData ?? previous.completionData ?? {};
    try {
      const result = await completeTask({ taskId, data: completionData });
      if ("error" in result) {
        applyTaskPatch(taskId, {
          completed: previous.completed,
          completionData: previous.completionData,
        });
      } else {
        evictOtherDayCache();
        router.refresh();
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

    // Optimistic flip: checkbox updates within the same frame as the tap.
    applyTaskPatch(taskId, { completed: nextCompleted });

    try {
      const result = previous.completed
        ? await uncompleteTask({ taskId })
        : await completeTask({ taskId });
      if ("error" in result) {
        applyTaskPatch(taskId, { completed: previous.completed });
      } else {
        evictOtherDayCache();
        router.refresh();
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
    const current = data.tasks.find((t) => t.id === activeTask.id) ?? activeTask;
    const categoryTasks = data.tasks.filter((t) => t.category === current.category);
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
        onPrefetch={prefetchDay}
        blockStartDate={data.blockStartDate}
        currentDay={data.currentDay}
        locale={locale}
        todayLabel={t("today")}
      />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground font-['Plus_Jakarta_Sans']">
          {locale === "zh"
            ? t("dayLabel", { day: toChineseNumeral(selectedDay) })
            : t("dayLabel", { day: selectedDay })}
        </h2>
        {data.missedDays > 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-foreground/80 backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
              {t("missedDays", { count: data.missedDays })}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-foreground/80 backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
              {t("onTrack")}
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
