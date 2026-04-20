"use client";

export function ScriptureMemoriseRenderer({
  reference,
  verseText,
  completed,
  onDone,
  loading,
  doneLabel,
  completedLabel,
}: {
  reference: string;
  verseText: string;
  completed: boolean;
  onDone: () => void;
  loading: boolean;
  doneLabel: string;
  completedLabel: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 font-headline text-lg font-bold text-foreground">
          {reference}
        </p>
        <p className="text-sm leading-relaxed text-foreground/80 italic">
          {verseText}
        </p>
      </div>

      <button
        onClick={onDone}
        disabled={completed || loading}
        className={`w-full rounded-md py-3 text-sm font-semibold transition-opacity ${
          completed
            ? "bg-green-100 text-green-700"
            : "bg-primary text-white hover:opacity-90"
        } disabled:opacity-60`}
      >
        {completed ? (
          <span className="flex items-center justify-center gap-2">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            {completedLabel}
          </span>
        ) : loading ? (
          "…"
        ) : (
          doneLabel
        )}
      </button>
    </div>
  );
}
