"use client";

import { useEffect, useState, useCallback } from "react";
import { DayEditor } from "./day-editor";

interface TaskRow {
  id: string;
  blockNumber: number;
  dayNumber: number;
  category: string;
  taskType: string;
  name: string;
  content: Record<string, unknown> | null;
  displayOrder: number;
  updatedAt: string;
}

export function AdminClient() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/admin/tasks");
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Group tasks by day
  const dayMap = new Map<number, TaskRow[]>();
  for (const task of tasks) {
    const existing = dayMap.get(task.dayNumber) ?? [];
    existing.push(task);
    dayMap.set(task.dayNumber, existing);
  }

  const days = Array.from({ length: 25 }, (_, i) => i + 1);

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <h1 className="font-headline text-xl font-bold text-foreground">
        Content Manager
      </h1>
      <p className="text-sm text-foreground/60">
        Block 1 — 25 Days · Edit content below
      </p>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && (
        <div className="space-y-2">
          {days.map((day) => {
            const dayTasks = dayMap.get(day) ?? [];
            const isExpanded = expandedDay === day;

            return (
              <div
                key={day}
                className="rounded-md bg-white shadow-card overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedDay(isExpanded ? null : day)
                  }
                  className="flex w-full items-center justify-between px-4 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {day}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      Day {day}
                    </span>
                    <span className="text-xs text-foreground/40">
                      {dayTasks.length} tasks
                    </span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[18px] text-foreground/30 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {isExpanded && (
                  <DayEditor tasks={dayTasks} onSaved={fetchTasks} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
