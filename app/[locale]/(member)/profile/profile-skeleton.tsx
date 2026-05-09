export function ProfileSkeleton() {
  return (
    <div className="flex min-h-full animate-pulse flex-col justify-between space-y-4 px-4 pt-4 pb-4">
      <div>
        <div className="flex items-center gap-4 rounded-md bg-white p-5 shadow-card">
          <div className="h-16 w-16 shrink-0 rounded-full bg-zinc-200" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 rounded bg-zinc-100" />
            <div className="h-3 w-44 rounded bg-zinc-100" />
          </div>
        </div>
      </div>
      <div className="h-12 rounded-md bg-zinc-100" />
    </div>
  );
}
