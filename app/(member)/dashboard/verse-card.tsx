"use client";

export function VerseCard({
  reference,
  text,
  label,
}: {
  reference: string;
  text: string;
  label: string;
}) {
  return (
    <div className="rounded-md bg-white p-6 shadow-card">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-tertiary">
        <span className="material-symbols-outlined text-[16px]">book</span>
        {label}
      </div>
      <p className="mb-2 font-headline text-sm font-semibold text-foreground">
        {reference}
      </p>
      <p className="text-sm italic leading-relaxed text-foreground/80">
        {text}
      </p>
    </div>
  );
}
