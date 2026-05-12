import { getSessionUser } from "@/src/features/auth";
import { getProfileForUser } from "@/src/features/profile/get-profile-for-user";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfileForUser(sessionUser.id);
  if (!profile) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(profile);
}
