import { cookies } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import type { SessionUser } from "@/src/features/auth/session";
import { BOARD_USER_COOKIE, isBoardLiveDataEnabled } from "./enabled";

// Read-only helpers for the board's "Local DB data" mode. Only SELECT queries.

/** The member the board is "viewing as", or null. Honoured only on a local DB. */
export async function getBoardUser(): Promise<SessionUser | null> {
  if (!isBoardLiveDataEnabled()) return null;
  const raw = (await cookies()).get(BOARD_USER_COOKIE)?.value;
  const id = Number(raw);
  if (!raw || !Number.isInteger(id) || id <= 0) return null;
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      displayName: users.displayName,
      searchHandle: users.searchHandle,
      onboardedAt: users.onboardedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return row ?? null;
}

export async function listBoardMembers() {
  return db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      searchHandle: users.searchHandle,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .orderBy(asc(users.id))
    .limit(100);
}
