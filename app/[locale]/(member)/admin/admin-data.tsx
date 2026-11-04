import { redirect } from "next/navigation";
import { sql, desc } from "drizzle-orm";
import { getSessionUser, isAdmin } from "@/src/features/auth";
import { getAllTasks } from "@/src/features/content/program";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { AdminClient } from "./admin-client";
import type { AdminStatsData } from "./admin-stats";
import type { UserRow } from "./admin-users-table";
import type { StreakRow } from "./admin-streak-table";

type StatsRow = { kind: string; period: string | null; count: number };
type BlockCompletionRow = {
  blockNumber: number;
  completedAllDays: number;
  meanDaysCompleted: number;
  medianDaysCompleted: number;
  completed1To4Days: number;
  completed5To14Days: number;
  completed15To19Days: number;
  completed20To24Days: number;
};
type ComponentCompletionRow = {
  blockNumber: number;
  category: "Mental" | "Emotional" | "Physical";
  completedTasks: number;
  membersStarted: number;
};

export async function AdminData({ locale }: { locale: string }) {
  const user = await getSessionUser();
  if (!user || !isAdmin(user)) redirect(`/${locale}`);

  const programTasks = getAllTasks();
  const blocks = [...new Set(programTasks.map((task) => task.block))].sort((a, b) => a - b);

  const [
    statsResult,
    allUsers,
    topStreaksResult,
    blockCompletionResult,
    componentCompletionResult,
  ] = await Promise.all([
    db.execute(sql`
      WITH
        totals AS (
          SELECT 'total'  AS kind, NULL::text AS period, count(*)::int AS count FROM nhp.users
          UNION ALL
          SELECT 'active', NULL, count(*)::int FROM nhp.users WHERE status = 'active'
        ),
        monthly_signups AS (
          SELECT 'monthly_signup' AS kind,
                 to_char(date_trunc('month', created_at), 'YYYY-MM') AS period,
                 count(*)::int AS count
          FROM nhp.users
          WHERE created_at >= now() - interval '12 months'
          GROUP BY 2
        ),
        monthly_active AS (
          SELECT 'monthly_active' AS kind,
                 to_char(date_trunc('month', completed_at), 'YYYY-MM') AS period,
                 count(distinct user_id)::int AS count
          FROM nhp.task_completions
          WHERE completed_at >= now() - interval '12 months'
          GROUP BY 2
        ),
        daily_signups AS (
          SELECT 'daily_signup' AS kind,
                 to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS period,
                 count(*)::int AS count
          FROM nhp.users
          WHERE created_at >= '2026-05-30'
          GROUP BY 2
        ),
        weekly_active AS (
          SELECT 'weekly_active' AS kind,
                 to_char(date_trunc('week', completed_at), 'YYYY-MM-DD') AS period,
                 count(distinct user_id)::int AS count
          FROM nhp.task_completions
          WHERE completed_at >= now() - interval '12 weeks'
          GROUP BY 2
        )
      SELECT * FROM totals
      UNION ALL SELECT * FROM monthly_signups
      UNION ALL SELECT * FROM monthly_active
      UNION ALL SELECT * FROM daily_signups
      UNION ALL SELECT * FROM weekly_active
    `),
    db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        searchHandle: users.searchHandle,
        status: users.status,
        role: users.role,
        emailVerifiedAt: users.emailVerifiedAt,
        onboardedAt: users.onboardedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt)),
    db.execute(sql`
      WITH completion_dates AS (
        SELECT
          user_id,
          (completed_at AT TIME ZONE 'UTC')::date AS d
        FROM nhp.task_completions
        GROUP BY user_id, (completed_at AT TIME ZONE 'UTC')::date
      ),
      numbered AS (
        SELECT
          user_id,
          d,
          d - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY d ASC))::int AS grp
        FROM completion_dates
      ),
      current_grp AS (
        SELECT DISTINCT ON (user_id) user_id, grp AS current_grp
        FROM numbered
        WHERE d >= (NOW() AT TIME ZONE 'UTC')::date - 1
        ORDER BY user_id, d DESC
      ),
      streaks AS (
        SELECT
          n.user_id,
          COUNT(*)::int AS streak
        FROM numbered n
        INNER JOIN current_grp cg ON n.user_id = cg.user_id AND n.grp = cg.current_grp
        GROUP BY n.user_id
      )
      SELECT
        u.id::int AS id,
        u.email,
        u.search_handle AS "searchHandle",
        s.streak::int AS streak
      FROM nhp.users u
      INNER JOIN streaks s ON u.id = s.user_id
      ORDER BY streak DESC, u.id ASC
      LIMIT 200
    `),
    db.execute(sql`
      WITH program_tasks(task_id, block_number, day_number) AS (
        VALUES ${sql.join(
          programTasks.map((task) => sql`(${task.id}, ${task.block}, ${task.day})`),
          sql`, `,
        )}
      ),
      member_block_days AS (
        SELECT tc.user_id, pt.block_number, count(DISTINCT pt.day_number)::int AS days_completed
        FROM program_tasks pt
        INNER JOIN nhp.task_completions tc ON tc.task_id = pt.task_id
        GROUP BY tc.user_id, pt.block_number
      )
      SELECT
        block_number::int AS "blockNumber",
        count(*) FILTER (WHERE days_completed = 25)::int AS "completedAllDays",
        avg(days_completed) AS "meanDaysCompleted",
        percentile_cont(0.5) WITHIN GROUP (ORDER BY days_completed) AS "medianDaysCompleted",
        count(*) FILTER (WHERE days_completed BETWEEN 1 AND 4)::int AS "completed1To4Days",
        count(*) FILTER (WHERE days_completed BETWEEN 5 AND 14)::int AS "completed5To14Days",
        count(*) FILTER (WHERE days_completed BETWEEN 15 AND 19)::int AS "completed15To19Days",
        count(*) FILTER (WHERE days_completed BETWEEN 20 AND 24)::int AS "completed20To24Days"
      FROM member_block_days
      GROUP BY block_number
      ORDER BY block_number
    `),
    db.execute(sql`
      WITH program_tasks(task_id, block_number, category) AS (
        VALUES ${sql.join(
          programTasks.map((task) => sql`(${task.id}, ${task.block}, ${task.category})`),
          sql`, `,
        )}
      ),
      block_members AS (
        SELECT DISTINCT tc.user_id, pt.block_number
        FROM program_tasks pt
        INNER JOIN nhp.task_completions tc ON tc.task_id = pt.task_id
      ),
      member_counts AS (
        SELECT block_number, count(*)::int AS members_started
        FROM block_members
        GROUP BY block_number
      ),
      component_completions AS (
        SELECT
          pt.block_number,
          pt.category,
          count(tc.task_id)::int AS completed_tasks
        FROM program_tasks pt
        LEFT JOIN nhp.task_completions tc ON tc.task_id = pt.task_id
        GROUP BY pt.block_number, pt.category
      )
      SELECT
        cc.block_number::int AS "blockNumber",
        cc.category,
        cc.completed_tasks::int AS "completedTasks",
        coalesce(mc.members_started, 0)::int AS "membersStarted"
      FROM component_completions cc
      LEFT JOIN member_counts mc ON mc.block_number = cc.block_number
      ORDER BY cc.block_number, cc.category
    `),
  ]);

  const rows = statsResult.rows as StatsRow[];
  const byKind = (kind: string) => rows.filter((r) => r.kind === kind);
  const blockCompletionRows = blockCompletionResult.rows as BlockCompletionRow[];
  const componentCompletionRows = componentCompletionResult.rows as ComponentCompletionRow[];
  const categories = ["Mental", "Emotional", "Physical"] as const;
  const taskCountsByComponent = new Map<string, number>();
  for (const task of programTasks) {
    const key = `${task.block}:${task.category}`;
    taskCountsByComponent.set(key, (taskCountsByComponent.get(key) ?? 0) + 1);
  }

  const stats: AdminStatsData = {
    total: Number(byKind("total")[0]?.count ?? 0),
    active: Number(byKind("active")[0]?.count ?? 0),
    monthlySignups: byKind("monthly_signup")
      .sort((a, b) => (b.period ?? "").localeCompare(a.period ?? ""))
      .map((r) => ({ month: r.period!, count: Number(r.count) })),
    monthlyActive: byKind("monthly_active")
      .sort((a, b) => (b.period ?? "").localeCompare(a.period ?? ""))
      .map((r) => ({ month: r.period!, count: Number(r.count) })),
    dailySignups: byKind("daily_signup")
      .sort((a, b) => (a.period ?? "").localeCompare(b.period ?? ""))
      .map((r) => ({ date: r.period!, count: Number(r.count) })),
    weeklyActiveUsers: byKind("weekly_active")
      .sort((a, b) => (a.period ?? "").localeCompare(b.period ?? ""))
      .map((r) => ({ week: r.period!, count: Number(r.count) })),
    blockCompletions: blocks.map((block) => {
      const row = blockCompletionRows.find((r) => Number(r.blockNumber) === block);
      return {
        block,
        completedAllDays: Number(row?.completedAllDays ?? 0),
        meanDaysCompleted: Number(row?.meanDaysCompleted ?? 0),
        medianDaysCompleted: Number(row?.medianDaysCompleted ?? 0),
        completed1To4Days: Number(row?.completed1To4Days ?? 0),
        completed5To14Days: Number(row?.completed5To14Days ?? 0),
        completed15To19Days: Number(row?.completed15To19Days ?? 0),
        completed20To24Days: Number(row?.completed20To24Days ?? 0),
      };
    }),
    componentCompletions: blocks.flatMap((block) =>
      categories.map((category) => {
        const row = componentCompletionRows.find(
          (component) => component.blockNumber === block && component.category === category,
        );
        const taskCount = taskCountsByComponent.get(`${block}:${category}`) ?? 0;
        const completedTasks = Number(row?.completedTasks ?? 0);
        const membersStarted = Number(row?.membersStarted ?? 0);
        return {
          block,
          category,
          completedTasks,
          taskCount,
          membersStarted,
          completionRate:
            membersStarted > 0 && taskCount > 0
              ? Math.round((completedTasks / (membersStarted * taskCount)) * 100)
              : 0,
        };
      }),
    ),
  };

  const userRows: UserRow[] = allUsers.map((u) => ({
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    searchHandle: u.searchHandle,
    status: u.status,
    role: u.role,
    emailVerifiedAt: u.emailVerifiedAt?.toISOString() ?? null,
    onboardedAt: u.onboardedAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  }));

  const streakRows: StreakRow[] = (
    topStreaksResult.rows as {
      id: number;
      email: string;
      searchHandle: string | null;
      streak: number;
    }[]
  ).map((r) => ({
    id: Number(r.id),
    email: r.email,
    searchHandle: r.searchHandle,
    streak: Number(r.streak),
  }));

  return <AdminClient locale={locale} stats={stats} users={userRows} streaks={streakRows} />;
}
