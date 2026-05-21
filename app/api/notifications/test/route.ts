import { getSessionUser } from "@/src/features/auth";
import { sendPushToUser } from "@/src/features/notifications/push";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await sendPushToUser(
    user.id,
    { title: "Test Notification", body: "Push notifications are working!", url: "/" },
    "test",
  );

  return Response.json({ success: true });
}
