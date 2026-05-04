import { getSessionUser } from "@/src/features/auth";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rawHandle: unknown = body?.searchHandle;

  if (typeof rawHandle !== "string") {
    return Response.json({ error: "invalid_username" }, { status: 400 });
  }

  const handle = rawHandle.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(handle)) {
    return Response.json({ error: "invalid_username" }, { status: 400 });
  }

  if (user.onboardedAt) {
    return Response.json({ success: true });
  }

  try {
    await db
      .update(users)
      .set({
        searchHandle: handle,
        onboardedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as { code?: string }).code
        : undefined;
    if (code === "23505") {
      return Response.json({ error: "username_taken" }, { status: 409 });
    }
    throw err;
  }

  return Response.json({ success: true });
}
