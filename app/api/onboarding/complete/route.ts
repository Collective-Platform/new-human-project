import { getSessionUser } from "@/src/features/auth";
import { db } from "@/src/db";
import { users } from "@/src/db/shared-schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.onboardedAt) {
    return Response.json({ success: true });
  }

  await db
    .update(users)
    .set({ onboardedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return Response.json({ success: true });
}
