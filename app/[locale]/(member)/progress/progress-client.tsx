"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { DayCarousel } from "./day-carousel";
import { TaskList } from "./task-list";
import { TaskDetail } from "./task-detail";
import type { ProgressPayload } from "@/src/features/progress";
import { completeTask, uncompleteTask } from "@/src/features/tasks/actions";

type TaskData = ProgressPayload["tasks"][number];
type ProgressData = ProgressPayload;

// Optimistic completion overrides, persisted to localStorage so a checked task
// stays checked across client navigation AND full reloads, even when the server
// payload (RSC router cache / "use cache" data) hasn't caught up yet. Each entry
// is dropped automatically once the server payload agrees (see reconcile below),
// so a stale override can never permanently mask a genuine server-side change.
const OVERRIDE_KEY = "progress-task-overrides-v1";

function readOverrides(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(OVERRIDE_KEY) || "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

function writeOverride(taskId: string, completed: boolean): void {
  if (typeof window === "undefined") return;
  const all = readOverrides();
  all[taskId] = completed;
  try {
    window.localStorage.setItem(OVERRIDE_KEY, JSON.stringify(all));
  } catch {
    // storage full / disabled — non-fatal, the in-memory state still updates.
  }
}

function clearOverride(taskId: string): void {
  if (typeof window === "undefined") return;
  const all = readOverrides();
  if (!(taskId in all)) return;
  delete all[taskId];
  try {
    window.localStorage.setItem(OVERRIDE_KEY, JSON.stringify(all));
  } catch {
    // non-fatal
  }
}

function applyPendingOverlay(data: ProgressData): ProgressData {
  const overrides = readOverrides();
  if (Object.keys(overrides).length === 0) return data;

  let changed = false;
  const tasks = data.tasks.map((t) => {
    const o = overrides[t.id];
    if (o === undefined || o === t.completed) return t;
    changed = true;
    return { ...t, completed: o };
  });
  if (!changed) return data;

  // Keep the selected day's carousel chip in sync with the overlaid tasks so the
  // day badge and the checkboxes can never disagree (the "day done but task
  // unchecked" symptom).
  const allDone = tasks.length > 0 && tasks.every((t) => t.completed);
  const carousel = data.carousel.map((c) =>
    c.day === data.selectedDay ? { ...c, fullyCompleted: allDone } : c,
  );
  return { ...data, tasks, carousel };
}

// Drop any override the server payload already reflects, so localStorage stays
// small and self-heals. Compares against the RAW server data, not the overlay.
function reconcileOverrides(data: ProgressData): void {
  const overrides = readOverrides();
  for (const t of data.tasks) {
    if (t.id in overrides && overrides[t.id] === t.completed) clearOverride(t.id);
  }
}

function computeLocalCurrentDay(blockStartDate: string): number {
  const msPerDay = 86_400_000;
  const now = new Date();
  // "today" as the user's LOCAL calendar date, normalized to a UTC epoch value
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  // onboarding date stays in UTC (matches server storage)
  const start = new Date(blockStartDate);
  const startMs = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const elapsed = Math.floor((todayMs - startMs) / msPerDay);
  return Math.min(Math.max(elapsed + 1, 1), 25);
}

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
  initialTaskId,
  isLocked: initialLocked,
  unlockMs,
}: {
  locale: string;
  initialData: ProgressData;
  initialTaskId?: string;
  isLocked?: boolean;
  unlockMs?: number;
}) {
  const pathname = usePathname();
  const t = useTranslations("progress");
  const [locked, setLocked] = useState(initialLocked ?? false);
  // Seeded from server-rendered payload — first paint shows real content,
  // no initial-load spinner. (Task 2.0 of tasks-perf-improvements.md)
  const [data, setData] = useState<ProgressData>(() => applyPendingOverlay(initialData));
  const [selectedDay, setSelectedDay] = useState<number>(initialData.selectedDay);
  const [activeTask, setActiveTask] = useState<TaskData | null>(null);
  const [activeTaskMode, setActiveTaskMode] = useState<"add" | number>("add");

  // Intent-based prefetch cache for day data. (Task 3.0)
  // Hovering / touching a day chip warms this cache so the subsequent
  // tap can resolve from memory instead of waiting on a round-trip.
  // This is intentionally a small ad-hoc cache that will be replaced
  // by TanStack Query in Task 4.0 — keep the surface minimal.
  const dayCacheRef = useRef<Map<number, ProgressData>>(
    new Map([[initialData.selectedDay, applyPendingOverlay(initialData)]]),
  );
  const inFlightRef = useRef<Map<number, Promise<ProgressData | null>>>(new Map());
  const taskNavStack = useRef<Array<{ task: TaskData; mode: "add" | number }>>([]);
  const skipNextPopRef = useRef(false);
  const initialTaskIdRef = useRef(initialTaskId);

  useEffect(() => {
    // Drop overrides the (raw) server payload already reflects before overlaying,
    // so confirmed completions stop being re-applied and the store self-heals.
    reconcileOverrides(initialData);
    const localDay = computeLocalCurrentDay(initialData.blockStartDate);
    const overlaid = applyPendingOverlay({ ...initialData, currentDay: localDay });
    setSelectedDay(initialData.selectedDay);
    setData(overlaid);
    dayCacheRef.current = new Map([[initialData.selectedDay, overlaid]]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData.selectedDay]);

  useEffect(() => {
    if (!initialTaskIdRef.current) return;
    const task = data.tasks.find((t) => t.id === initialTaskIdRef.current);
    if (task) {
      handleTaskTap(task);
      initialTaskIdRef.current = undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only: data.tasks is pre-populated from server-rendered initialData

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
    if (!d) return;
    // Reconcile overrides the server already confirms, then re-apply any
    // still-pending overrides so carousel navigation never shows a stale unchecked
    // state while the server cache catches up.
    reconcileOverrides(d);
    const overlaid = applyPendingOverlay(d);
    setData((prev) => ({ ...overlaid, currentDay: prev.currentDay }));
    if (overlaid !== d) dayCacheRef.current.set(day, overlaid);
  }

  // Advance currentDay at the user's local midnight so the "Today" label updates
  // without a page refresh.
  useEffect(() => {
    const now = new Date();
    const nextLocalMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(() => {
      setData((prev) => ({
        ...prev,
        currentDay: computeLocalCurrentDay(prev.blockStartDate),
      }));
    }, nextLocalMidnight.getTime() - now.getTime());
    return () => clearTimeout(timer);
  }, []); // mount-only — fires at the next local midnight then cleans up

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

  useEffect(() => {
    if (!locked || !unlockMs) return;
    const remaining = unlockMs - Date.now();
    if (remaining <= 0) {
      setLocked(false);
      return;
    }
    const id = setTimeout(() => setLocked(false), remaining);
    return () => clearTimeout(id);
  }, [locked, unlockMs]);

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
    // Patch the selected day in dayCacheRef and propagate the updated carousel
    // entry for selectedDay into every other cached day's payload so that
    // navigating the carousel never shows a stale fullyCompleted chip.
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
      for (const [day, other] of Array.from(dayCacheRef.current.entries())) {
        if (day !== selectedDay) {
          dayCacheRef.current.set(day, {
            ...other,
            carousel: other.carousel.map((c) =>
              c.day === selectedDay ? { ...c, fullyCompleted: allDone } : c,
            ),
          });
        }
      }
    }
  }

  async function handleComplete(taskId: string, taskData?: Record<string, unknown>) {
    if (locked) return;
    const previous = data.tasks.find((t) => t.id === taskId);
    if (!previous) return;

    // Optimistic: mark complete immediately so Next/checkbox feel instant.
    applyTaskPatch(taskId, {
      completed: true,
      completionData: taskData ?? previous.completionData,
    });
    // Persist the override BEFORE the server round-trip so the checked state
    // survives navigation even if the user leaves before completeTask() resolves.
    writeOverride(taskId, true);

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
        clearOverride(taskId);
      }
    } catch {
      applyTaskPatch(taskId, {
        completed: previous.completed,
        completionData: previous.completionData,
      });
      clearOverride(taskId);
    }
  }

  async function handleToggleComplete(taskId: string) {
    if (locked) return;
    const previous = data.tasks.find((t) => t.id === taskId);
    if (!previous) return;

    const nextCompleted = !previous.completed;

    // Optimistic flip: checkbox updates within the same frame as the tap.
    applyTaskPatch(taskId, { completed: nextCompleted });
    // Persist the override BEFORE the server round-trip so it survives navigation.
    writeOverride(taskId, nextCompleted);

    try {
      const result = previous.completed
        ? await uncompleteTask({ taskId })
        : await completeTask({ taskId });
      if ("error" in result) {
        applyTaskPatch(taskId, { completed: previous.completed });
        clearOverride(taskId);
      }
    } catch {
      applyTaskPatch(taskId, { completed: previous.completed });
      clearOverride(taskId);
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

  async function handleDaySelect(day: number) {
    setSelectedDay(day);
    setActiveTask(null);
    window.history.replaceState(null, "", `${pathname}?day=${day}`);
    await fetchDay(day);
  }

  if (activeTask) {
    const current = data.tasks.find((t) => t.id === activeTask.id) ?? activeTask;
    const categoryTasks = data.tasks.filter((t) => t.category === current.category);
    return (
      <TaskDetail
        task={current}
        locale={locale}
        blockNumber={data.blockNumber}
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
    <div className="px-4 sm:px-6 md:px-8 pt-4">
      {locked && (
        <div className="mb-4 flex border border-primary rounded-2xl bg-primary/10 items-center justify-center px-4 py-3 text-center">
          <span className="text-base font-medium tracking-wider text-primary">
            {locale === "zh"
              ? "我们将于 1 June 2026 一起开始"
              : "We will start together on 1 June 2026"}
          </span>
        </div>
      )}
      <DayCarousel
        days={data.carousel}
        selectedDay={selectedDay}
        onSelectAction={handleDaySelect}
        onPrefetchAction={prefetchDay}
        blockStartDate={data.blockStartDate}
        currentDay={data.currentDay}
        locale={locale}
        todayLabel={t("today")}
      />

      <div className="flex items-center justify-between mt-6 mb-6">
        <h2 className="text-2xl font-headline font-bold text-foreground">
          {locale === "zh"
            ? t("dayLabel", { day: toChineseNumeral(selectedDay) })
            : t("dayLabel", { day: selectedDay })}
        </h2>
        {data.missedDays > 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-foreground/80 backdrop-blur-sm">
            <span className="text-[10px] font-medium uppercase tracking-wider text-foreground">
              {t("missedDays", { count: data.missedDays })}
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
        tasks={data.tasks}
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
