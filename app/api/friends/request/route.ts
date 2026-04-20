import { getSessionUser } from "@/src/features/auth";
import { sendFriendRequest } from "@/src/features/community";
import { sendPushToUser } from "@/src/features/notifications";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { receiverId } = body as { receiverId: number };

  if (!receiverId) {
    return Response.json({ error: "receiverId required" }, { status: 400 });
  }

  const result = await sendFriendRequest(user.id, receiverId);

  // Send push notification to receiver for new requests
  if (result) {
    const senderName = user.displayName ?? user.firstName ?? "Someone";
    sendPushToUser(
      receiverId,
      {
        title: "The New Human Project",
        body: `${senderName} sent you a friend request`,
        url: "/community",
      },
      "friend_request"
    ).catch(() => {});
  }

  return Response.json({ success: true, alreadyExists: result === null });
}
