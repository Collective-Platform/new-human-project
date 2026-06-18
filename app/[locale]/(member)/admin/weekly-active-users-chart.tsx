const BAR_HEIGHT = 80;

function formatWeek(yyyyMMDD: string): string {
  const [year, month, day] = yyyyMMDD.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function WeeklyActiveUsersChart({ rows }: { rows: { week: string; count: number }[] }) {
  const maxCount = Math.max(...rows.map((r) => r.count), 1);
  const thisWeekStart = (() => {
    const now = new Date();
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    // ISO week starts Monday
    const day = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
    return d.toISOString().slice(0, 10);
  })();
  const thisWeekRow = rows.find((r) => r.week === thisWeekStart);
  const thisWeekCount = thisWeekRow?.count ?? 0;

  return (
    <div className="rounded-md bg-white shadow-card overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">
          Weekly Active Users (Last 12 Weeks)
        </p>
        <span className="text-xs font-semibold tabular-nums text-foreground">
          {thisWeekCount} this week
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-foreground/40">No activity yet</p>
      ) : (
        <div className="px-4 py-4 overflow-x-auto">
          <div className="flex gap-2" style={{ minWidth: "max-content" }}>
            {rows.map(({ week, count }) => {
              const barH = count > 0 ? Math.max((count / maxCount) * BAR_HEIGHT, 6) : 2;
              const isCurrent = week === thisWeekStart;
              return (
                <div
                  key={week}
                  className="w-8 shrink-0 flex flex-col justify-end items-center gap-0.5"
                  style={{ height: BAR_HEIGHT }}
                >
                  {count > 0 && (
                    <span className="text-[9px] text-foreground/50 leading-none">{count}</span>
                  )}
                  <div
                    className={`w-6 rounded-t-md transition-all duration-500 ${isCurrent ? "bg-blue-500" : "bg-zinc-800"}`}
                    style={{ height: barH, opacity: count > 0 ? 1 : 0.1 }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 mt-2" style={{ minWidth: "max-content" }}>
            {rows.map(({ week }) => (
              <div key={week} className="w-8 shrink-0 flex justify-center">
                <span
                  className="text-[9px] text-foreground/40 -rotate-45 origin-top-left translate-x-2"
                  title={formatWeek(week)}
                >
                  {week.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
