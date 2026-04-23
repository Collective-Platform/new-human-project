"use client";

import Markdown from "react-markdown";

export function DevotionalRenderer({
  passageRef,
  focus,
  readingNotes,
  keyIdea,
  reflection,
  practice,
  completed,
  onDone,
  loading,
  doneLabel,
  completedLabel,
}: {
  passageRef: string;
  focus: string;
  readingNotes: string;
  keyIdea: string;
  reflection: string;
  practice: string;
  completed: boolean;
  onDone: () => void;
  loading: boolean;
  doneLabel: string;
  completedLabel: string;
}) {
  return (
    <div className="space-y-6">
      <p className="font-headline text-lg font-bold text-foreground">
        {passageRef}
      </p>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground/50">
          Today's Focus
        </p>
        <p className="text-sm leading-relaxed text-foreground/80">{focus}</p>
      </div>

      {readingNotes && (
        <div className="rounded-sm bg-zinc-50 p-4">
          <div className="space-y-2 text-sm leading-relaxed text-foreground/70">
            <Markdown
              components={{
                p: ({ children }) => <p className="mb-2">{children}</p>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground/80">
                    {children}
                  </strong>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-4 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-4 space-y-1">{children}</ol>
                ),
                li: ({ children }) => <li>{children}</li>,
              }}
            >
              {readingNotes}
            </Markdown>
          </div>
        </div>
      )}

      {keyIdea && (
        <blockquote className="border-l-4 border-primary pl-4 italic text-foreground/80">
          <p className="text-sm leading-relaxed">{keyIdea}</p>
        </blockquote>
      )}

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground/50">
          Reflection
        </p>
        <p className="text-sm leading-relaxed text-foreground/80">
          {reflection}
        </p>
      </div>

      {practice && (
        <div className="rounded-sm bg-amber-50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground/50">
            Today's Practice
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">
            {practice}
          </p>
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
