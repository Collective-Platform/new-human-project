import { getSessionUser } from "@/src/features/auth";
import { acceptFriendRequest } from "@/src/features/community";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { requestId } = body as { requestId: string };

  if (!requestId) {
    return Response.json({ error: "requestId required" }, { status: 400 });
  }

  const result = await acceptFriendRequest(requestId, user.id);

  if (!result) {
    return Response.json({ error: "Request not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
