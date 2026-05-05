"use client";

import { MarkdownContent } from "./markdown-content";

export function DevotionalRenderer({
  introMarkdown,
  passageRef,
  focus,
  readingNotes,
  keyIdea,
  reflection,
  practice,
}: {
  introMarkdown?: string;
  passageRef: string;
  focus: string;
  readingNotes: string;
  keyIdea: string;
  reflection: string;
  practice: string;
}) {
  return (
    <div className="space-y-6">
      {introMarkdown && (
        <div className="rounded-sm bg-zinc-50 p-4">
          <div className="space-y-2 text-sm leading-relaxed text-foreground/75">
            <MarkdownContent>{introMarkdown}</MarkdownContent>
          </div>
        </div>
      )}

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
          <MarkdownContent>{readingNotes}</MarkdownContent>
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
