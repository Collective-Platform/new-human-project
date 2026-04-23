"use client";

import Markdown from "react-markdown";

export function ScriptureStudyRenderer({
  reference,
  passageText,
  explanation,
  videoUrl,
}: {
  reference: string;
  passageText: string;
  explanation: string;
  videoUrl: string;
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
