"use client";

interface PrefetchedPassage {
  reference: string;
  content: string;
}

/**
 * Renders a Bible passage that was prefetched server-side in `/api/progress`
 * (locale-aware). Renders nothing extra — just the verses for the active
 * locale, instantly.
 */
export function BilingualPassage({
  passage,
  fallbackText,
}: {
  passage: PrefetchedPassage | null;
  fallbackText?: string;
}) {
  if (passage?.content) {
    return (
      <div
        className="text-sm leading-relaxed text-foreground/80 [&_p]:mb-2"
        dangerouslySetInnerHTML={{ __html: passage.content }}
      />
    );
  }

  if (fallbackText) {
    return (
      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
        {fallbackText}
      </p>
    );
  }

  return (
    <p className="text-sm text-foreground/60">
      Read this passage in your Bible or Bible app.
    </p>
  );
}
