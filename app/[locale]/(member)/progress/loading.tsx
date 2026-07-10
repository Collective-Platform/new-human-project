export default function Loading() {
  return (
    <div className="animate-pulse px-4 sm:px-6 md:px-8 pt-4 pb-8">
      {/* Day carousel */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="h-14 w-14 shrink-0 rounded-full bg-zinc-50" />
        ))}
      </div>

      {/* Header row: "Day N" title + status pill */}
      <div className="flex items-center justify-between mt-6 mb-6">
        <div className="h-8 w-28 rounded bg-zinc-200" />
        <div className="h-7 w-20 rounded-full border border-foreground/20" />
      </div>

      {/* Category sections */}
      <div className="space-y-8 pb-6">
        {Array.from({ length: 3 }, (_, s) => (
          <section key={s} className="space-y-3">
            {/* Section header: icon + title */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-zinc-100" />
              <div className="h-6 w-24 rounded bg-zinc-200" />
            </div>

            {/* Grouped task card */}
            <div className="rounded-3xl bg-white shadow-card overflow-hidden">
              {Array.from({ length: 2 }, (_, r) => (
                <div key={r} className={r === 0 ? "" : "border-t border-zinc-50"}>
                  <div className="flex w-full items-center gap-3 px-5 py-3.5">
                    <div className="h-5 w-5 shrink-0 rounded-full bg-zinc-100" />
                    <div className="h-4 flex-1 rounded bg-zinc-100" />
                    <div className="h-4 w-4 shrink-0 rounded bg-zinc-100" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
