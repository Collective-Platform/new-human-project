import { db } from "@/src/db";
import { notificationLog, users } from "@/src/db/schema";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

const SOCIAL_TYPES = ["friend_request", "friend_accepted", "like"];

export async function getNotificationsForUser(userId: number) {
  return db
    .select()
    .from(notificationLog)
    .where(and(eq(notificationLog.userId, userId), inArray(notificationLog.type, SOCIAL_TYPES)))
    .orderBy(desc(notificationLog.sentAt))
    .limit(30);
}

export async function markNotificationsRead(userId: number) {
  await db
    .update(notificationLog)
    .set({ readAt: new Date() })
    .where(and(eq(notificationLog.userId, userId), isNull(notificationLog.readAt)));
}

export async function getUserNotificationPrefs(userId: number) {
  const rows = await db
    .select({ notificationPrefs: users.notificationPrefs })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0]?.notificationPrefs ?? null;
}
