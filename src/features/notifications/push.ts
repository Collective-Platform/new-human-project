import webpush from "web-push";
import { db } from "@/src/db";
import { pushSubscriptions, notificationLog } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/src/env";
import { SOCIAL_TYPES, getUnreadSocialCount } from "./queries";

function ensureVapid() {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return false;
  }
  webpush.setVapidDetails(
    "mailto:noreply@thenewhumanproject.app",
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
  return true;
}

export async function sendPushToUser(
  userId: number,
  payload: { title: string; body: string; url?: string },
  type: string,
) {
  // Always log to the in-app inbox regardless of push delivery.
  await db.insert(notificationLog).values({
    userId,
    type,
    title: payload.title,
    body: payload.body,
  });

  // Best-effort push delivery — failure here doesn't affect the inbox.
  if (!ensureVapid()) return;

  const rows = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      subscription: pushSubscriptions.subscription,
    })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  if (rows.length === 0) return;

  // Only social notifications drive the home-screen badge — it mirrors the
  // in-app bell's unread social count. Reminders/broadcasts buzz but don't
  // badge, so we omit `badge` for them and the SW leaves the badge untouched.
  const badge = SOCIAL_TYPES.includes(type) ? await getUnreadSocialCount(userId) : undefined;
  const body = JSON.stringify(badge === undefined ? payload : { ...payload, badge });

  for (const row of rows) {
    const sub = row.subscription as webpush.PushSubscription;
    try {
      await webpush.sendNotification(sub, body);
    } catch (err: unknown) {
      const statusCode = err instanceof webpush.WebPushError ? err.statusCode : 0;
      if (statusCode === 410 || statusCode === 404) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, row.endpoint));
      }
    }
  }
}
