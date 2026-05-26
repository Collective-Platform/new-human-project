export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 px-3 pt-4 pb-4">
      {/* Tab bar */}
      <div className="flex gap-2">
        <div className="h-9 w-24 rounded-full bg-zinc-200" />
        <div className="h-9 w-24 rounded-full bg-zinc-100" />
      </div>

      {/* Friend/feed cards */}
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-md bg-white p-4 shadow-[0_4px_16px_rgba(53,50,47,0.03)]"
          >
            <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-200" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-4 w-2/5 rounded bg-zinc-100" />
              <div className="h-3 w-3/5 rounded bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
