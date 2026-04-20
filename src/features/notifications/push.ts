import webpush from "web-push";
import { db } from "@/src/db";
import { pushSubscriptions, notificationLog } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/src/env";

function ensureVapid() {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return false;
  }
  webpush.setVapidDetails(
    "mailto:noreply@thenewhumanproject.app",
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
  return true;
}

export async function sendPushToUser(
  userId: number,
  payload: { title: string; body: string; url?: string },
  type: string
) {
  if (!ensureVapid()) return;

  const rows = await db
    .select({ subscription: pushSubscriptions.subscription })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
    .limit(1);

  if (rows.length === 0) return;

  const sub = rows[0].subscription as webpush.PushSubscription;

  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));

    // Log the notification
    await db.insert(notificationLog).values({
      userId,
      type,
      title: payload.title,
      body: payload.body,
    });
  } catch (err: unknown) {
    const statusCode =
      err instanceof webpush.WebPushError ? err.statusCode : 0;
    // Subscription expired or invalid — clean up
    if (statusCode === 410 || statusCode === 404) {
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));
    }
  }
}
