"use client";

export function ScriptureMemoriseRenderer({
  reference,
  verseText,
}: {
  reference: string;
  verseText: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 font-headline text-lg font-bold text-foreground">
          {reference}
        </p>
        <p className="text-sm leading-relaxed text-foreground/80 italic">
          {verseText}
        </p>
      </div>
    </div>
  );
}
