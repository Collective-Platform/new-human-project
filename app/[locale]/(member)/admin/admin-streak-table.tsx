export interface StreakRow {
  id: number;
  email: string;
  searchHandle: string | null;
  streak: number;
}

export function AdminStreakTable({ users }: { users: StreakRow[] }) {
  return (
    <div className="rounded-md bg-white shadow-card overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">
          Top Streaks
        </p>
        <span className="text-xs text-foreground/40 tabular-nums">{users.length} users</span>
      </div>

      <div className="overflow-x-auto max-h-120 overflow-y-auto">
        <table className="w-full min-w-100">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <Th>#</Th>
              <Th>Email</Th>
              <Th>Username</Th>
              <Th>Streak (days)</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((u, i) => (
              <tr key={u.id} className="hover:bg-zinc-50/60 transition-colors">
                <Td muted>{i + 1}</Td>
                <Td>{u.email}</Td>
                <Td>{u.searchHandle ?? <span className="text-foreground/30">—</span>}</Td>
                <Td>
                  <span className="font-semibold tabular-nums text-orange-600">{u.streak}</span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left text-xs font-medium text-foreground/50 whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <td
      className={`px-4 py-2.5 text-sm whitespace-nowrap ${muted ? "text-foreground/50 tabular-nums" : "text-foreground"}`}
    >
      {children}
    </td>
  );
}
