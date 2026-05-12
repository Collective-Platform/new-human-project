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
        className="text-md leading-relaxed text-foreground [&_p]:mb-2 [&_.yv-vlbl]:text-[10px] [&_.yv-vlbl]:font-bold [&_.yv-vlbl]:align-super [&_.yv-vlbl]:text-foreground/40 [&_.yv-vlbl]:mr-0.5 [&_.yv-vlbl]:select-none"
        dangerouslySetInnerHTML={{ __html: passage.content }}
      />
    );
  }

  if (fallbackText) {
    return (
      <p className="whitespace-pre-line text-md leading-relaxed text-foreground">
        {fallbackText}
      </p>
    );
  }

  return (
    <p className="text-md text-foreground">
      Read this passage in your Bible or Bible app.
    </p>
  );
}
