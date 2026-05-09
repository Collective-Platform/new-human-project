export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4 px-4 pt-4 pb-4">
      {/* Radar chart card */}
      <div className="rounded-md bg-white p-5 shadow-card">
        <div className="mx-auto aspect-[200/210] w-full max-w-60 rounded-full bg-zinc-100" />
        <div className="mt-3 flex justify-between">
          <div className="h-3 w-16 rounded bg-zinc-100" />
          <div className="h-3 w-16 rounded bg-zinc-100" />
          <div className="h-3 w-16 rounded bg-zinc-100" />
        </div>
      </div>

      {/* Foundation card */}
      <div className="rounded-md border border-surface-container bg-white p-8 shadow-card">
        <div className="mb-2 h-2.5 w-24 rounded bg-zinc-100" />
        <div className="mb-4 h-7 w-44 rounded bg-zinc-100" />
        <div className="mb-6 space-y-2">
          <div className="h-3 w-full rounded bg-zinc-100" />
          <div className="h-3 w-full rounded bg-zinc-100" />
          <div className="h-3 w-3/4 rounded bg-zinc-100" />
        </div>
        <div className="mb-8 grid grid-cols-5 gap-2">
          {Array.from({ length: 15 }, (_, i) => (
            <div key={i} className="aspect-square rounded-sm bg-zinc-100" />
          ))}
        </div>
        <div className="h-14 rounded-full bg-zinc-100" />
      </div>

      {/* Activity calendar card */}
      <div className="rounded-md bg-white p-5 shadow-card">
        <div className="mb-3 h-3 w-28 rounded bg-zinc-100" />
        <div className="mb-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="h-3 rounded bg-zinc-100" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="h-7 rounded-sm bg-zinc-50" />
          ))}
        </div>
      </div>

      {/* Recent feed */}
      <section className="space-y-4">
        <div className="h-7 w-32 rounded bg-zinc-200 px-2" />
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-md bg-white p-4 shadow-[0_4px_16px_rgba(53,50,47,0.03)]"
            >
              <div className="h-10 w-1.5 shrink-0 rounded-full bg-zinc-100" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-4 w-3/4 rounded bg-zinc-100" />
                <div className="h-3 w-1/2 rounded bg-zinc-100" />
              </div>
              <div className="h-5 w-5 shrink-0 rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
