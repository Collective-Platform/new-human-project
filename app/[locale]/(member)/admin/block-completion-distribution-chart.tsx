export interface BlockCompletionDistribution {
  block: number;
  completedAllDays: number;
  completed1To4Days: number;
  completed5To14Days: number;
  completed15To19Days: number;
  completed20To24Days: number;
}

const ranges: {
  label: string;
  value: (row: BlockCompletionDistribution) => number;
}[] = [
  { label: "1–4 days", value: (row) => row.completed1To4Days },
  { label: "5–14 days", value: (row) => row.completed5To14Days },
  { label: "15–19 days", value: (row) => row.completed15To19Days },
  { label: "20–24 days", value: (row) => row.completed20To24Days },
  { label: "25 days", value: (row) => row.completedAllDays },
];

export function BlockCompletionDistributionChart({
  rows,
}: {
  rows: BlockCompletionDistribution[];
}) {
  const max = Math.max(...rows.flatMap((row) => ranges.map(({ value }) => value(row))), 1);

  return (
    <div className="border-t border-zinc-100 px-4 py-4">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">
            Completion distribution
          </p>
          <p className="mt-1 text-xs text-foreground/50">Members who started the block</p>
        </div>
        <span className="shrink-0 text-xs text-foreground/50">Same scale for every block</span>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {rows.map((row) => (
          <section key={row.block} aria-label={`Block ${row.block} completion distribution`}>
            <h3 className="text-sm font-semibold text-foreground">Block {row.block}</h3>
            <div className="mt-3 space-y-3">
              {ranges.map(({ label, value }) => {
                const count = value(row);
                return (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="text-foreground/60">{label}</span>
                      <span className="font-semibold tabular-nums text-foreground">{count}</span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-zinc-100"
                      role="img"
                      aria-label={`${label}: ${count} members`}
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
