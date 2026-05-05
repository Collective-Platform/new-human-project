"use client";

import { BilingualPassage } from "./bilingual-passage";
import { MarkdownContent } from "./markdown-content";

export function ScriptureStudyRenderer({
  introMarkdown,
  title,
  reference,
  passageText,
  prefetchedPassage,
  explanation,
  videoUrl,
}: {
  introMarkdown?: string;
  title: string;
  reference: string;
  passageText: string;
  prefetchedPassage: { reference: string; content: string } | null;
  explanation: string;
  videoUrl: string;
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

      <div>
        <h1 className="mb-2 font-headline text-xl font-bold text-foreground">
          {title}
        </h1>
        <p className="mb-3 text-sm text-foreground/70">{reference}</p>
        <BilingualPassage
          passage={prefetchedPassage}
          fallbackText={passageText}
        />
      </div>

      {explanation && (
        <div className="rounded-sm bg-zinc-50 p-4">
          <div className="space-y-2 text-sm leading-relaxed text-foreground/70">
            <MarkdownContent>{explanation}</MarkdownContent>
          </div>
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
    </div>
  );
}
