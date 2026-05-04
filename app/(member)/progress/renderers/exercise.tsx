"use client";

export function ExerciseRenderer({
  completed,
  onToggle,
  loading,
  label,
  completedLabel,
}: {
  completed: boolean;
  onToggle: () => void;
  loading: boolean;
  label: string;
  completedLabel: string;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={completed || loading}
      className={`flex w-full items-center gap-4 rounded-md px-5 py-4 text-left transition-colors ${
        completed
          ? "bg-primary/10"
          : "bg-zinc-50 hover:bg-zinc-100"
      } disabled:cursor-default`}
    >
      {completed ? (
        <span
          className="material-symbols-outlined text-[24px] text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          check_circle
        </span>
      ) : (
        <span className="material-symbols-outlined text-[24px] text-zinc-300">
          circle
        </span>
      )}
      <span
        className={`flex-1 text-sm font-medium ${completed ? "text-primary" : "text-foreground"}`}
      >
        {completed ? completedLabel : label}
      </span>
      {loading && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      )}
    </button>
  );
}
