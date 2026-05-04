"use client";

import Markdown from "react-markdown";
import { BilingualPassage } from "./bilingual-passage";

export function ScriptureStudyRenderer({
  title,
  reference,
  passageText,
  prefetchedPassage,
  explanation,
  videoUrl,
}: {
  title: string;
  reference: string;
  passageText: string;
  prefetchedPassage: { reference: string; content: string } | null;
  explanation: string;
  videoUrl: string;
}) {
  return (
    <div className="space-y-6">
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
              {explanation}
            </Markdown>
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
