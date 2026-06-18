import { BroadcastForm } from "./broadcast-form";
import { AdminStats } from "./admin-stats";
import type { AdminStatsData } from "./admin-stats";
import { AdminUsersTable } from "./admin-users-table";
import type { UserRow } from "./admin-users-table";
import { AdminStreakTable } from "./admin-streak-table";
import type { StreakRow } from "./admin-streak-table";

export function AdminClient({
  stats,
  users,
  streaks,
}: {
  stats: AdminStatsData;
  users: UserRow[];
  streaks: StreakRow[];
}) {
  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <h1 className="font-headline text-xl font-bold text-foreground">Admin</h1>

      <AdminStats stats={stats} />

      <AdminStreakTable users={streaks} />

      <AdminUsersTable users={users} />

      {/* Push Notifications */}
      <div className="rounded-md bg-white shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100">
          <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">
            Push Notifications
          </p>
        </div>
        <BroadcastForm />
      </div>
    </div>
  );
}
