import { getSessionUser } from "@/src/features/auth";
import { db } from "@/src/db";
import { pushSubscriptions } from "@/src/db/schema";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { subscription } = body as { subscription: PushSubscriptionJSON };

  if (!subscription?.endpoint) {
    return Response.json({ error: "subscription required" }, { status: 400 });
  }

  // Upsert by endpoint so the same device re-subscribing replaces its row,
  // but other devices belonging to the same user are preserved.
  await db
    .insert(pushSubscriptions)
    .values({
      userId: user.id,
      endpoint: subscription.endpoint,
      subscription,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId: user.id,
        subscription,
      },
    });

  return Response.json({ success: true });
}
