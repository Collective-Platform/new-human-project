"use client";

import {
  BookOpenText,
  Smile,
  SportShoe,
  CheckCircle,
  Circle,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

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
  labels,
}: {
  tasks: TaskItem[];
  onTaskTap: (task: TaskItem) => void;
  onToggleComplete: (taskId: string) => void;
  labels: { mental: string; emotional: string; physical: string };
}) {
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
            <div className="rounded-3xl bg-white shadow-card">
              <div className="divide-y divide-zinc-50">
                {catTasks.map((task) => {
                  const isExercise = task.taskType === "exercise";
                  const isMoodLog = task.taskType === "mood_log";
                  return (
                    <div
                      key={task.id}
                      className="flex w-full items-center gap-3 px-5 py-3.5 first:rounded-t-3xl last:rounded-b-3xl"
                    >
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
                          className={`flex-1 text-sm font-medium ${task.completed ? "text-foreground/50" : "text-foreground"}`}
                        >
                          {task.name}
                        </span>
                        <ChevronRight size={18} className="text-zinc-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
