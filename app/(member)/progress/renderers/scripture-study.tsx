"use client";

export function ScriptureStudyRenderer({
  reference,
  passageText,
  explanation,
  videoUrl,
  completed,
  onDone,
  loading,
  doneLabel,
  completedLabel,
}: {
  reference: string;
  passageText: string;
  explanation: string;
  videoUrl: string;
  completed: boolean;
  onDone: () => void;
  loading: boolean;
  doneLabel: string;
  completedLabel: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 font-headline text-lg font-bold text-foreground">
          {reference}
        </p>
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
          {passageText}
        </p>
      </div>

      {explanation && (
        <div className="rounded-sm bg-zinc-50 p-4">
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/70">
            {explanation}
          </p>
        </div>
      )}

      {videoUrl && (
        <div className="aspect-video overflow-hidden rounded-sm">
          <iframe
            src={videoUrl.replace("watch?v=", "embed/")}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

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
