import { redirect } from "next/navigation";
import { count, eq, sql, desc } from "drizzle-orm";
import { getSessionUser, isAdmin } from "@/src/features/auth";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { AdminClient } from "./admin-client";
import type { AdminStatsData } from "./admin-stats";
import type { UserRow } from "./admin-users-table";

export async function AdminData({ locale }: { locale: string }) {
  const user = await getSessionUser();
  if (!user || !isAdmin(user)) redirect(`/${locale}`);

  const [[{ total }], [{ active }], signupsResult, activeResult, allUsers] =
    await Promise.all([
      db.select({ total: count() }).from(users),
      db
        .select({ active: count() })
        .from(users)
        .where(eq(users.status, "active")),
      db.execute(sql`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
             count(*)::int AS count
      FROM nhp.users
      WHERE created_at >= now() - interval '12 months'
      GROUP BY 1 ORDER BY 1 DESC
    `),
      db.execute(sql`
      SELECT to_char(date_trunc('month', completed_at), 'YYYY-MM') AS month,
             count(distinct user_id)::int AS count
      FROM nhp.task_completions
      WHERE completed_at >= now() - interval '12 months'
      GROUP BY 1 ORDER BY 1 DESC
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
    ]);

  const stats: AdminStatsData = {
    total: Number(total),
    active: Number(active),
    monthlySignups: (
      signupsResult.rows as Array<{ month: string; count: number }>
    ).map((r) => ({
      month: r.month,
      count: Number(r.count),
    })),
    monthlyActive: (
      activeResult.rows as Array<{ month: string; count: number }>
    ).map((r) => ({
      month: r.month,
      count: Number(r.count),
    })),
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

  return <AdminClient stats={stats} users={userRows} />;
}
