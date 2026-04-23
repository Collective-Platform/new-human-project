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

const categoryConfig: Record<string, { color: string; border: string }> = {
  Mental: {
    color: "bg-category-mental",
    border: "border-l-category-mental",
  },
  Emotional: {
    color: "bg-category-emotional",
    border: "border-l-category-emotional",
  },
  Physical: {
    color: "bg-category-physical border-[#d4c8a0]",
    border: "border-l-category-physical",
  },
};

export function TaskList({
  tasks,
  onTaskTap,
  labels,
}: {
  tasks: TaskItem[];
  onTaskTap: (task: TaskItem) => void;
  labels: { mental: string; emotional: string; physical: string };
}) {
  const categories = ["Mental", "Emotional", "Physical"] as const;
  const labelMap: Record<string, string> = {
    Mental: labels.mental,
    Emotional: labels.emotional,
    Physical: labels.physical,
  };

  return (
    <div className="space-y-4">
      {categories.map((cat) => {
        const catTasks = tasks.filter((t) => t.category === cat);
        const config = categoryConfig[cat];

        return (
          <div
            key={cat}
            className={`rounded-md border-l-4 bg-white shadow-card ${config.border}`}
          >
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${config.color}`} />
                <h3 className="text-sm font-semibold text-foreground">
                  {labelMap[cat]}
                </h3>
              </div>
            </div>
            <div className="divide-y divide-zinc-50">
              {catTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onTaskTap(task)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50"
                >
                  {task.completed ? (
                    <span
                      className="material-symbols-outlined text-[20px] text-green-500"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px] text-zinc-300">
                      circle
                    </span>
                  )}
                  <span
                    className={`flex-1 text-sm ${task.completed ? "text-foreground/50" : "text-foreground"}`}
                  >
                    {task.name}
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-zinc-400">
                    chevron_right
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
