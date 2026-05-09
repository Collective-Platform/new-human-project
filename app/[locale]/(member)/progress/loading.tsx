export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 px-4 pt-4 pb-4">
      {/* Day carousel */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="h-16 w-14 shrink-0 rounded-xl bg-zinc-100" />
        ))}
      </div>

      {/* Task list header */}
      <div className="h-6 w-24 rounded bg-zinc-200" />

      {/* Task cards */}
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-md bg-white p-4 shadow-[0_4px_16px_rgba(53,50,47,0.03)]"
          >
            <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-100" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-zinc-100" />
              <div className="h-3 w-1/2 rounded bg-zinc-100" />
            </div>
            <div className="h-6 w-6 shrink-0 rounded-full bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
