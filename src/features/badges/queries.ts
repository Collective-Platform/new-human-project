import { db } from "@/src/db";
import {
  memberBadges,
  badgeDefinitions,
  memberBlockCompletions,
} from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Returns the most recently earned badge for a user that hasn't been
 * "seen" yet. We track seen status via a `seenAt` check — if the badge
 * was earned but the user hasn't loaded the dashboard since, it's new.
 *
 * For simplicity we just return the Block 1 badge if it exists and was
 * earned (the celebration screen handles dismissal client-side via
 * localStorage).
 */
export async function getNewlyEarnedBadge(userId: number, blockNumber: number) {
  const rows = await db
    .select({
      badgeId: memberBadges.badgeId,
      earnedAt: memberBadges.earnedAt,
      name: badgeDefinitions.name,
      description: badgeDefinitions.description,
      iconUrl: badgeDefinitions.iconUrl,
      blockNumber: badgeDefinitions.blockNumber,
    })
    .from(memberBadges)
    .innerJoin(badgeDefinitions, eq(memberBadges.badgeId, badgeDefinitions.id))
    .where(
      and(
        eq(memberBadges.userId, userId),
        eq(badgeDefinitions.blockNumber, blockNumber)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Check whether the user has completed the given block.
 */
export async function hasCompletedBlock(
  userId: number,
  blockNumber: number
): Promise<boolean> {
  const rows = await db
    .select({ id: memberBlockCompletions.id })
    .from(memberBlockCompletions)
    .where(
      and(
        eq(memberBlockCompletions.userId, userId),
        eq(memberBlockCompletions.blockNumber, blockNumber)
      )
    )
    .limit(1);

  return rows.length > 0;
}
