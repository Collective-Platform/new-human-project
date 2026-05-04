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
        <p className="mb-1 text-sm font-bold uppercase tracking-widest text-primary">
          Today&apos;s Focus
        </p>
        <p className="text-md leading-relaxed italic text-foreground">
          {focus}
        </p>
      </div>

      {readingNotes && (
        <div className="space-y-2 text-md leading-relaxed text-foreground">
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
      )}

      {keyIdea && (
        <blockquote className="border-l-4 border-primary text-foreground bg-primary/10 p-4">
          <p className="mb-1 text-sm font-bold uppercase tracking-widest text-primary">
            Key Idea
          </p>
          <p className="text-md leading-relaxed">{keyIdea}</p>
        </blockquote>
      )}

      <div>
        <p className="mb-1 text-sm font-bold uppercase tracking-widest text-primary">
          Reflection
        </p>
        <p className="text-md leading-relaxed text-foreground">{reflection}</p>
      </div>

      {practice && (
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-widest text-primary">
            Today&apos;s Practice
          </p>
          <p className="text-md leading-relaxed text-foreground">{practice}</p>
        </div>
      )}
    </div>
  );
}
