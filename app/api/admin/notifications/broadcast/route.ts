import { getSessionUser, isAdmin } from "@/src/features/auth";
import { db } from "@/src/db";
import { pushSubscriptions } from "@/src/db/schema";
import { sendPushToUser } from "@/src/features/notifications/push";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !isAdmin(user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    title,
    body: message,
    url,
  } = body as {
    title: string;
    body: string;
    url?: string;
  };

  if (!title?.trim() || !message?.trim()) {
    return Response.json({ error: "title and body are required" }, { status: 400 });
  }

  const rows = await db
    .selectDistinct({ userId: pushSubscriptions.userId })
    .from(pushSubscriptions);

  let sent = 0;
  for (const row of rows) {
    try {
      await sendPushToUser(
        row.userId,
        { title: title.trim(), body: message.trim(), url: url || "/" },
        "broadcast",
      );
      sent++;
    } catch {
      // Continue to next user
    }
  }

  return Response.json({ success: true, sent });
}
