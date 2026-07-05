import { redirect } from "next/navigation";
import { sql, desc } from "drizzle-orm";
import { getSessionUser, isAdmin } from "@/src/features/auth";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { AdminClient } from "./admin-client";
import type { AdminStatsData } from "./admin-stats";
import type { UserRow } from "./admin-users-table";
import type { StreakRow } from "./admin-streak-table";

type StatsRow = { kind: string; period: string | null; count: number };

export async function AdminData({ locale }: { locale: string }) {
  const user = await getSessionUser();
  if (!user || !isAdmin(user)) redirect(`/${locale}`);

  const [statsResult, allUsers, topStreaksResult] = await Promise.all([
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
  ]);

  const rows = statsResult.rows as StatsRow[];
  const byKind = (kind: string) => rows.filter((r) => r.kind === kind);

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

  return <AdminClient stats={stats} users={userRows} streaks={streakRows} />;
}
