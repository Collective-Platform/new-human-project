import { getSessionUser } from "@/src/features/auth";
import { db } from "@/src/db";
import { pushSubscriptions } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { subscription } = body as { subscription: PushSubscriptionJSON };

  if (!subscription?.endpoint) {
    return Response.json(
      { error: "subscription required" },
      { status: 400 }
    );
  }

  // Upsert: delete old subscription, insert new one
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, user.id));

  await db.insert(pushSubscriptions).values({
    userId: user.id,
    subscription,
  });

  return Response.json({ success: true });
}
