export interface UserRow {
  id: number;
  email: string;
  displayName: string | null;
  searchHandle: string | null;
  status: string;
  role: string;
  emailVerifiedAt: string | null;
  onboardedAt: string | null;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  guest: "bg-zinc-100 text-zinc-500",
  suspended: "bg-yellow-100 text-yellow-700",
  deleted: "bg-red-100 text-red-600",
};

const ROLE_STYLES: Record<string, string> = {
  su: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  user: "",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AdminUsersTable({ users }: { users: UserRow[] }) {
  return (
    <div className="rounded-md bg-white shadow-card overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">
          All Users
        </p>
        <span className="text-xs text-foreground/40 tabular-nums">
          {users.length} rows
        </span>
      </div>

      <div className="overflow-x-auto max-h-120 overflow-y-auto">
        <table className="w-full min-w-175">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <Th>ID</Th>
              <Th>Email</Th>
              <Th>Name</Th>
              <Th>Handle</Th>
              <Th>Status</Th>
              <Th>Role</Th>
              <Th>Verified</Th>
              <Th>Onboarded</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-50/60 transition-colors">
                <Td muted>{u.id}</Td>
                <Td>{u.email}</Td>
                <Td>
                  {u.displayName ?? (
                    <span className="text-foreground/30">—</span>
                  )}
                </Td>
                <Td muted>
                  {u.searchHandle ?? (
                    <span className="text-foreground/30">—</span>
                  )}
                </Td>
                <Td>
                  <Badge
                    text={u.status}
                    className={
                      STATUS_STYLES[u.status] ?? "bg-zinc-100 text-zinc-500"
                    }
                  />
                </Td>
                <Td>
                  {u.role === "user" ? (
                    <span className="text-foreground/30 text-xs">user</span>
                  ) : (
                    <Badge
                      text={u.role}
                      className={ROLE_STYLES[u.role] ?? ""}
                    />
                  )}
                </Td>
                <Td>
                  {u.emailVerifiedAt ? (
                    <span className="text-green-600 text-xs font-medium">
                      ✓
                    </span>
                  ) : (
                    <span className="text-foreground/30">—</span>
                  )}
                </Td>
                <Td muted>{formatDate(u.onboardedAt)}</Td>
                <Td muted>{formatDate(u.createdAt)}</Td>
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

function Td({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <td
      className={`px-4 py-2.5 text-sm whitespace-nowrap ${muted ? "text-foreground/50 tabular-nums" : "text-foreground"}`}
    >
      {children}
    </td>
  );
}

function Badge({ text, className }: { text: string; className: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {text}
    </span>
  );
}
