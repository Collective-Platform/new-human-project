import { getSessionUser } from "@/src/features/auth";
import { db } from "@/src/db";
import {
  users,
  memberBadges,
  badgeDefinitions,
} from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get full user info
  const userRows = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      searchHandle: users.searchHandle,
      avatarUrl: users.avatarUrl,
      notificationPrefs: users.notificationPrefs,
      privacyPublic: users.privacyPublic,
    })
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1);

  if (userRows.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const user = userRows[0];

  // Get earned badges
  const badges = await db
    .select({
      name: badgeDefinitions.name,
      description: badgeDefinitions.description,
      iconUrl: badgeDefinitions.iconUrl,
      blockNumber: badgeDefinitions.blockNumber,
      earnedAt: memberBadges.earnedAt,
    })
    .from(memberBadges)
    .innerJoin(badgeDefinitions, eq(memberBadges.badgeId, badgeDefinitions.id))
    .where(eq(memberBadges.userId, sessionUser.id))
    .orderBy(badgeDefinitions.blockNumber);

  return Response.json({
    user: {
      email: user.email,
      displayName: user.displayName,
      searchHandle: user.searchHandle,
      avatarUrl: user.avatarUrl,
      notificationPrefs: user.notificationPrefs ?? {
        daily_reminder: true,
        reminder_time: "08:00",
        friend_requests: true,
      },
      privacyPublic: user.privacyPublic ?? true,
    },
    badges: badges.map((b) => ({
      name: b.name,
      description: b.description,
      iconUrl: b.iconUrl,
      blockNumber: b.blockNumber,
      earnedAt: b.earnedAt.toISOString(),
    })),
  });
}

