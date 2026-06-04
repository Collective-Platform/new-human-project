interface MonthRow {
  month: string;
  count: number;
}

export interface AdminStatsData {
  total: number;
  active: number;
  monthlySignups: MonthRow[];
  monthlyActive: MonthRow[];
}

function formatMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function AdminStats({ stats }: { stats: AdminStatsData }) {
  const guest = stats.total - stats.active;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="rounded-md bg-white shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100">
          <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">
            Users Overview
          </p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-zinc-100">
          <StatCard label="Total Users" value={stats.total} />
          <StatCard label="Activated Users" value={stats.active} />
          <StatCard label="Guests" value={guest} />
        </div>
      </div>

      {/* Monthly tables */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MonthTable
          title="Monthly Signups"
          colHeader="New Users"
          rows={stats.monthlySignups}
        />
        <MonthTable
          title="Monthly Active Users"
          colHeader="Active Users"
          rows={stats.monthlyActive}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-4">
      <span className="text-xs font-medium uppercase tracking-wider text-foreground/50">
        {label}
      </span>
      <span className="text-2xl font-bold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function MonthTable({
  title,
  colHeader,
  rows,
}: {
  title: string;
  colHeader: string;
  rows: MonthRow[];
}) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="rounded-md bg-white shadow-card overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100">
        <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">{title}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-foreground/40">No data yet</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="px-4 py-2 text-left text-xs font-medium text-foreground/50">Month</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-foreground/50">
                {colHeader}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr key={row.month}>
                <td className="px-4 py-2.5 text-sm text-foreground">{formatMonth(row.month)}</td>
                <td className="px-4 py-2.5 text-right text-sm tabular-nums text-foreground">
                  {row.count}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-200 bg-zinc-50">
              <td className="px-4 py-2 text-xs font-medium text-foreground/50">Total</td>
              <td className="px-4 py-2 text-right text-sm font-semibold tabular-nums text-foreground">
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
