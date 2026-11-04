import { DailySignupsChart } from "./daily-signups-chart";
import { WeeklyActiveUsersChart } from "./weekly-active-users-chart";
import { BlockCompletionDistributionChart } from "./block-completion-distribution-chart";

interface MonthRow {
  month: string;
  count: number;
}

interface DayRow {
  date: string;
  count: number;
}

interface WeekRow {
  week: string;
  count: number;
}

interface BlockCompletionRow {
  block: number;
  completedAllDays: number;
  meanDaysCompleted: number;
  medianDaysCompleted: number;
  completed1To4Days: number;
  completed5To14Days: number;
  completed15To19Days: number;
  completed20To24Days: number;
}

interface ComponentCompletionRow {
  block: number;
  category: "Mental" | "Emotional" | "Physical";
  completedTasks: number;
  taskCount: number;
  membersStarted: number;
  completionRate: number;
}

export interface AdminStatsData {
  total: number;
  active: number;
  monthlySignups: MonthRow[];
  monthlyActive: MonthRow[];
  dailySignups: DayRow[];
  weeklyActiveUsers: WeekRow[];
  blockCompletions: BlockCompletionRow[];
  componentCompletions: ComponentCompletionRow[];
}

function formatMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function AdminStats({ locale, stats }: { locale: string; stats: AdminStatsData }) {
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
        <MonthTable title="Monthly Signups" colHeader="New Users" rows={stats.monthlySignups} />
        <MonthTable
          title="Monthly Active Users"
          colHeader="Active Users"
          rows={stats.monthlyActive}
        />
      </div>

      <div className="rounded-md bg-white shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100">
          <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">
            Block Completions
          </p>
        </div>
        <BlockStatRow
          label="Mean days completed"
          rows={stats.blockCompletions}
          value={(row) => Math.round(row.meanDaysCompleted)}
        />
        <BlockStatRow
          label="Median days completed"
          rows={stats.blockCompletions}
          value={(row) => Math.round(row.medianDaysCompleted)}
        />
        <BlockCompletionDistributionChart rows={stats.blockCompletions} />
      </div>

      <ComponentCompletionTable locale={locale} rows={stats.componentCompletions} />

      <DailySignupsChart rows={stats.dailySignups} />

      <WeeklyActiveUsersChart rows={stats.weeklyActiveUsers} />
    </div>
  );
}

const componentStyles = {
  Mental: { bar: "bg-category-mental", text: "text-category-mental" },
  Emotional: { bar: "bg-category-emotional", text: "text-category-emotional" },
  Physical: { bar: "bg-category-physical", text: "text-category-physical" },
} as const;

function ComponentCompletionTable({
  locale,
  rows,
}: {
  locale: string;
  rows: ComponentCompletionRow[];
}) {
  const isChinese = locale === "zh";
  const copy = isChinese
    ? {
        title: "各模块完成情况",
        description: "完成任务数及已开始该模块成员的平均完成率",
        block: "模块",
        completed: "已完成任务",
        rate: "完成率",
        noData: "暂无完成数据",
        category: { Mental: "心智", Emotional: "情感", Physical: "身体" },
      }
    : {
        title: "Component Completion by Block",
        description:
          "Completed tasks and average completion rate for members who started each block",
        block: "Block",
        completed: "Completed tasks",
        rate: "Completion rate",
        noData: "No completion data yet",
        category: { Mental: "Mental", Emotional: "Emotional", Physical: "Physical" },
      };

  const blocks = [...new Set(rows.map((row) => row.block))];

  return (
    <div className="overflow-hidden rounded-md bg-white shadow-card">
      <div className="px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">
          {copy.title}
        </p>
        <p className="mt-1 text-xs text-foreground/50">{copy.description}</p>
      </div>

      {rows.length === 0 ? (
        <p className="border-t border-zinc-100 px-4 py-6 text-center text-sm text-foreground/40">
          {copy.noData}
        </p>
      ) : (
        <div className="overflow-x-auto border-t border-zinc-100">
          <table className="w-full min-w-165">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-foreground/50">
                  {copy.block}
                </th>
                {(["Mental", "Emotional", "Physical"] as const).map((category) => (
                  <th
                    key={category}
                    className="px-4 py-2 text-left text-xs font-medium text-foreground/50"
                  >
                    <span className={componentStyles[category].text}>
                      {copy.category[category]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {blocks.map((block) => (
                <tr key={block}>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    {copy.block} {block}
                  </th>
                  {(["Mental", "Emotional", "Physical"] as const).map((category) => {
                    const row = rows.find(
                      (item) => item.block === block && item.category === category,
                    );
                    const completion = row?.completedTasks ?? 0;
                    const rate = row?.completionRate ?? 0;
                    return (
                      <td key={category} className="min-w-45 px-4 py-3 align-top">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-sm font-semibold tabular-nums text-foreground">
                            {completion}
                          </span>
                          <span className="text-xs tabular-nums text-foreground/55">{rate}%</span>
                        </div>
                        <div
                          className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100"
                          role="img"
                          aria-label={`${copy.category[category]}: ${completion} ${copy.completed.toLowerCase()}, ${rate}% ${copy.rate.toLowerCase()}`}
                        >
                          <div
                            className={`h-full rounded-full ${componentStyles[category].bar}`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BlockStatRow({
  label,
  rows,
  value,
}: {
  label: string;
  rows: BlockCompletionRow[];
  value: (row: BlockCompletionRow) => number;
}) {
  return (
    <div className="border-t border-zinc-100">
      <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wider text-foreground/50">
        {label}
      </p>
      <div className="grid grid-cols-2 divide-x divide-y divide-zinc-100 sm:grid-cols-4">
        {rows.map((row) => (
          <StatCard key={row.block} label={`Block ${row.block}`} value={value(row)} />
        ))}
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
