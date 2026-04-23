"use client";

import Markdown from "react-markdown";

export function DevotionalRenderer({
  passageRef,
  focus,
  readingNotes,
  keyIdea,
  reflection,
  practice,
}: {
  passageRef: string;
  focus: string;
  readingNotes: string;
  keyIdea: string;
  reflection: string;
  practice: string;
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

    </div>
  );
}
