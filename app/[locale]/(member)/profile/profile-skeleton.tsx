export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-surface antialiased animate-pulse">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 pt-8 pb-8">
        {/* Profile header */}
        <section className="mb-10">
          <div className="flex items-start justify-between gap-4">
            {/* Left: username + friends pill */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <div className="h-9 w-36 rounded-lg bg-surface-container" />
                <div className="h-7 w-24 rounded-full bg-surface-container" />
              </div>
            </div>
            {/* Right: avatar circle */}
            <div className="w-24 h-24 rounded-full bg-surface-container shrink-0 border-4 border-surface shadow-xl" />
          </div>
        </section>

        {/* Activities */}
        <section>
          <div className="h-6 w-24 rounded bg-surface-container mb-4" />
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-2xl flex items-center gap-4 shadow-[0_4px_20px_rgba(53,50,47,0.04)]"
              >
                <div className="w-14 h-14 rounded-full bg-surface-container shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-surface-container" />
                  <div className="h-3 w-1/3 rounded bg-surface-container" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Logout button */}
      <div className="max-w-2xl mx-auto px-6 pb-8">
        <div className="h-12 w-full rounded-2xl bg-white shadow-[0_4px_20px_rgba(53,50,47,0.04)]" />
      </div>
    </div>
  );
}
