import { getSessionUser } from "@/src/features/auth";
import { sendFriendRequest } from "@/src/features/community";

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

  return Response.json({ success: true, alreadyExists: result === null });
}
