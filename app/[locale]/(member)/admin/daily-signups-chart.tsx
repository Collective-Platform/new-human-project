const BAR_HEIGHT = 80;

function formatDate(yyyyMMDD: string): string {
  const [year, month, day] = yyyyMMDD.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function DailySignupsChart({ rows }: { rows: { date: string; count: number }[] }) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  const maxCount = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="rounded-md bg-white shadow-card overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">
          Daily Signups (Since May 30)
        </p>
        <span className="text-xs font-semibold tabular-nums text-foreground">{total} total</span>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-foreground/40">
          No signups in the last 30 days
        </p>
      ) : (
        <div className="px-4 py-4 overflow-x-auto">
          <div className="flex gap-1" style={{ minWidth: "max-content" }}>
            {rows.map(({ date, count }) => {
              const barH = count > 0 ? Math.max((count / maxCount) * BAR_HEIGHT, 6) : 2;
              return (
                <div
                  key={date}
                  className="w-7 shrink-0 flex flex-col justify-end items-center gap-0.5"
                  style={{ height: BAR_HEIGHT }}
                >
                  {count > 0 && (
                    <span className="text-[9px] text-foreground/50 leading-none">{count}</span>
                  )}
                  <div
                    className="w-5 bg-zinc-800 rounded-t-md transition-all duration-500"
                    style={{ height: barH, opacity: count > 0 ? 1 : 0.1 }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex gap-1 mt-2" style={{ minWidth: "max-content" }}>
            {rows.map(({ date }) => (
              <div key={date} className="w-7 shrink-0 flex justify-center">
                <span
                  className="text-[9px] text-foreground/40 -rotate-45 origin-top-left translate-x-2"
                  title={formatDate(date)}
                >
                  {date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
