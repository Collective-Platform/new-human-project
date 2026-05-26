import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/src/db";
import { users, memberBadges, badgeDefinitions } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

export interface ProfileData {
  user: {
    email: string;
    displayName: string | null;
    searchHandle: string | null;
    avatarUrl: string | null;
    notificationPrefs: {
      daily_reminder: boolean;
      reminder_time: string;
      friend_requests: boolean;
    };
    privacyPublic: boolean;
  };
  badges: {
    name: string;
    description: string | null;
    iconUrl: string | null;
    blockNumber: number;
    earnedAt: string | null;
  }[];
}

export async function getProfileForUser(userId: number): Promise<ProfileData | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(`profile:${userId}`);
  const userRows = await db
    .select({
      email: users.email,
      displayName: users.displayName,
      searchHandle: users.searchHandle,
      avatarUrl: users.avatarUrl,
      notificationPrefs: users.notificationPrefs,
      privacyPublic: users.privacyPublic,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userRows.length === 0) return null;

  const user = userRows[0];

  const badges = await db
    .select({
      name: badgeDefinitions.name,
      description: badgeDefinitions.description,
      iconUrl: badgeDefinitions.iconUrl,
      blockNumber: badgeDefinitions.blockNumber,
      earnedAt: memberBadges.earnedAt,
    })
    .from(badgeDefinitions)
    .leftJoin(
      memberBadges,
      and(eq(memberBadges.badgeId, badgeDefinitions.id), eq(memberBadges.userId, userId)),
    )
    .orderBy(badgeDefinitions.blockNumber);

  return {
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
      earnedAt: b.earnedAt?.toISOString() ?? null,
    })),
  };
}
