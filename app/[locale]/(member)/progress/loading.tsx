export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse px-4 pb-8 pt-6 sm:px-6 md:px-8">
      {/* Tabs + start plan button */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <div className="h-9 w-20 rounded-full bg-zinc-200" />
          <div className="h-9 w-24 rounded-full bg-zinc-100" />
        </div>
        <div className="h-11 w-11 shrink-0 rounded-full bg-zinc-200" />
      </div>

      {/* Plan cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-card border border-outline/30 bg-surface px-5 py-4">
            <div className="space-y-2">
              <div className="h-3 w-14 rounded bg-zinc-100" />
              <div className="h-6 w-40 rounded bg-zinc-200" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-3 w-24 rounded bg-zinc-100" />
              <div className="h-1 rounded-full bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
