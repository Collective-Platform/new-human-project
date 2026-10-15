import { cache } from "react";
import { inArray, eq } from "drizzle-orm";
import { getMaxContentBlock } from "@/src/features/content/program";
import { db } from "@/src/db";
import { memberBlockAttempts } from "@/src/db/schema";
import {
  BLOCK_LAUNCH,
  dateStringToMarker,
  getActiveBlock,
  type ActiveBlock,
  type BlockAttempt,
} from "@/src/lib/program-gate";

type AttemptRow = typeof memberBlockAttempts.$inferSelect;

function toAttempt(row: AttemptRow): BlockAttempt {
  return {
    blockNumber: row.blockNumber,
    attempt: row.attempt,
    startsOn: dateStringToMarker(row.startsOn),
    completedAt: row.completedAt,
  };
}

/** Uncached read. Use this inside server actions that just wrote attempts. */
export async function fetchAttempts(userId: number): Promise<BlockAttempt[]> {
  const rows = await db
    .select()
    .from(memberBlockAttempts)
    .where(eq(memberBlockAttempts.userId, userId));
  return rows.map(toAttempt);
}

/** Per-request cached read of a user's block attempts. */
export const getAttempts = cache(fetchAttempts);

/** One query for many users (daily reminders). Users with no rows map to []. */
export async function getAttemptsForUsers(userIds: number[]): Promise<Map<number, BlockAttempt[]>> {
  const byUser = new Map<number, BlockAttempt[]>();
  if (userIds.length === 0) return byUser;
  const rows = await db
    .select()
    .from(memberBlockAttempts)
    .where(inArray(memberBlockAttempts.userId, userIds));
  for (const row of rows) {
    const list = byUser.get(row.userId) ?? [];
    list.push(toAttempt(row));
    byUser.set(row.userId, list);
  }
  return byUser;
}

/** Where a user is right now. Block math itself lives in `program-gate`. */
export async function getActiveBlockForUser(
  user: { id: number; onboardedAt: Date | null },
  now: Date,
  tz: string,
): Promise<ActiveBlock> {
  const attempts = await getAttempts(user.id);
  return getActiveBlock(
    user.onboardedAt ?? BLOCK_LAUNCH[1],
    attempts,
    now,
    tz,
    getMaxContentBlock(),
  );
}
