"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { completeTask, uncompleteTask } from "@/src/features/tasks/actions";
import type { ProgressCarouselDay } from "./get-progress-for-user";

export interface CompletionState {
  blockNumber: number;
  blockStartDate: string;
  currentDay: number;
  selectedDay: number;
  missedDays: number;
  carousel: ProgressCarouselDay[];
  completions: Record<string, Record<string, unknown> | null>;
  taskIdsByDay: Record<number, string[]>;
}

interface ProgressContextValue {
  state: CompletionState | null;
  initialize: (state: CompletionState) => void;
  updateCurrentDay: (day: number) => void;
  updateSelectedDay: (day: number) => void;
  markComplete: (taskId: string, data?: Record<string, unknown>) => Promise<void>;
  markIncomplete: (taskId: string) => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function useProgressContext(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgressContext must be used inside ProgressProvider");
  return ctx;
}

function findTaskDay(taskId: string, taskIdsByDay: Record<number, string[]>): number | null {
  for (const [day, ids] of Object.entries(taskIdsByDay)) {
    if (ids.includes(taskId)) return Number(day);
  }
  return null;
}

function applyComplete(
  prev: CompletionState,
  taskId: string,
  data: Record<string, unknown> | undefined,
): CompletionState {
  const taskDay = findTaskDay(taskId, prev.taskIdsByDay);
  const merged = data != null ? { ...prev.completions[taskId], ...data } : null;
  const newCompletions = { ...prev.completions, [taskId]: merged };

  const dayHadCompletion =
    taskDay !== null &&
    (prev.taskIdsByDay[taskDay] ?? []).some((id) => id !== taskId && id in prev.completions);

  const carousel =
    taskDay !== null
      ? prev.carousel.map((c) => {
          if (c.day !== taskDay) return c;
          const allDone = (prev.taskIdsByDay[taskDay] ?? []).every((id) => id in newCompletions);
          return { ...c, fullyCompleted: allDone };
        })
      : prev.carousel;

  let missedDays = prev.missedDays;
  if (!dayHadCompletion && taskDay !== null && taskDay < prev.currentDay) {
    missedDays = Math.max(0, missedDays - 1);
  }

  return { ...prev, completions: newCompletions, carousel, missedDays };
}

function applyIncomplete(prev: CompletionState, taskId: string): CompletionState {
  const taskDay = findTaskDay(taskId, prev.taskIdsByDay);
  const newCompletions = { ...prev.completions };
  delete newCompletions[taskId];

  const dayStillHasCompletion =
    taskDay !== null &&
    (prev.taskIdsByDay[taskDay] ?? []).some((id) => id !== taskId && id in newCompletions);

  const carousel =
    taskDay !== null
      ? prev.carousel.map((c) => (c.day === taskDay ? { ...c, fullyCompleted: false } : c))
      : prev.carousel;

  let missedDays = prev.missedDays;
  if (!dayStillHasCompletion && taskDay !== null && taskDay < prev.currentDay) {
    missedDays += 1;
  }

  return { ...prev, completions: newCompletions, carousel, missedDays };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CompletionState | null>(null);
  const initializedRef = useRef(false);

  function initialize(newState: CompletionState) {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setState(newState);
  }

  function updateCurrentDay(day: number) {
    setState((prev) => (prev ? { ...prev, currentDay: day } : prev));
  }

  function updateSelectedDay(day: number) {
    setState((prev) => (prev ? { ...prev, selectedDay: day } : prev));
  }

  async function markComplete(taskId: string, data?: Record<string, unknown>) {
    if (!state) return;
    const prev = state;
    setState(applyComplete(prev, taskId, data));
    const result = await completeTask({ taskId, data: data ?? {} });
    if ("error" in result) {
      setState(prev);
    }
  }

  async function markIncomplete(taskId: string) {
    if (!state) return;
    const prev = state;
    setState(applyIncomplete(prev, taskId));
    const result = await uncompleteTask({ taskId });
    if ("error" in result) {
      setState(prev);
    }
  }

  return (
    <ProgressContext.Provider value={{ state, initialize, updateCurrentDay, updateSelectedDay, markComplete, markIncomplete }}>
      {children}
    </ProgressContext.Provider>
  );
}
