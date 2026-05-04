"use client";

interface TaskItem {
  id: string;
  category: string;
  taskType: string;
  name: string;
  content: Record<string, unknown> | null;
  completed: boolean;
  completionData: Record<string, unknown> | null;
}

const categoryConfig: Record<
  string,
  { iconBg: string; iconColor: string; icon: string }
> = {
  Mental: {
    iconBg: "bg-[#ffaca3]",
    iconColor: "text-[#c10014]",
    icon: "auto_stories",
  },
  Emotional: {
    iconBg: "bg-[#d7e2ff]",
    iconColor: "text-[#135db9]",
    icon: "mood",
  },
  Physical: {
    iconBg: "bg-[#fef6e3]",
    iconColor: "text-[#645f50]",
    icon: "fitness_center",
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

        return (
          <section key={cat} className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${config.iconBg} ${config.iconColor}`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {config.icon}
                </span>
              </div>
              <h3 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-foreground">
                {labelMap[cat]}
              </h3>
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
                          if (isMoodLog) {
                            onTaskTap(task);
                          } else {
                            onToggleComplete(task.id);
                          }
                        }}
                        className="shrink-0 flex items-center justify-center transition-transform active:scale-90"
                        aria-label={
                          isMoodLog
                            ? "Open mood log"
                            : task.completed
                              ? "Mark incomplete"
                              : "Mark complete"
                        }
                      >
                        {task.completed ? (
                          <span
                            className="material-symbols-outlined text-[20px] leading-none text-primary"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-[20px] leading-none text-zinc-300 hover:text-primary/80 transition-colors">
                            circle
                          </span>
                        )}
                      </button>
                      {isExercise ? (
                        <span
                          className={`flex-1 text-sm font-medium ${task.completed ? "text-foreground/50" : "text-foreground"}`}
                        >
                          {task.name}
                        </span>
                      ) : (
                        <button
                          onClick={() => onTaskTap(task)}
                          className="flex flex-1 items-center text-left transition-colors hover:opacity-70"
                        >
                          <span
                            className={`flex-1 text-sm font-medium ${task.completed ? "text-foreground/50" : "text-foreground"}`}
                          >
                            {task.name}
                          </span>
                          <span className="material-symbols-outlined text-[18px] text-zinc-400">
                            chevron_right
                          </span>
                        </button>
                      )}
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
