import { getSessionUser } from "@/src/features/auth";
import { db } from "@/src/db";
import {
  users,
  memberBadges,
  badgeDefinitions,
} from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get full user info
  const userRows = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      searchHandle: users.searchHandle,
      avatarUrl: users.avatarUrl,
      notificationPrefs: users.notificationPrefs,
      privacyPublic: users.privacyPublic,
    })
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1);

  if (userRows.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const user = userRows[0];

  // Get earned badges
  const badges = await db
    .select({
      name: badgeDefinitions.name,
      description: badgeDefinitions.description,
      iconUrl: badgeDefinitions.iconUrl,
      blockNumber: badgeDefinitions.blockNumber,
      earnedAt: memberBadges.earnedAt,
    })
    .from(memberBadges)
    .innerJoin(badgeDefinitions, eq(memberBadges.badgeId, badgeDefinitions.id))
    .where(eq(memberBadges.userId, sessionUser.id))
    .orderBy(badgeDefinitions.blockNumber);

  return Response.json({
    user: {
      email: user.email,
      displayName: user.displayName,
      searchHandle: user.searchHandle,
      avatarUrl: user.avatarUrl,
      notificationPrefs: user.notificationPrefs ?? {
        daily_reminder: true,
        reminder_time: "08:00",
        friend_requests: true,
      },
      privacyPublic: user.privacyPublic ?? true,
    },
    badges: badges.map((b) => ({
      name: b.name,
      description: b.description,
      iconUrl: b.iconUrl,
      blockNumber: b.blockNumber,
      earnedAt: b.earnedAt.toISOString(),
    })),
  });
}

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.notificationPrefs !== undefined) {
    updates.notificationPrefs = body.notificationPrefs;
  }
  if (body.privacyPublic !== undefined) {
    updates.privacyPublic = body.privacyPublic;
  }
  if (body.displayName !== undefined) {
    if (typeof body.displayName !== "string") {
      return Response.json({ error: "Invalid displayName" }, { status: 400 });
    }
    const trimmed = body.displayName.trim();
    if (trimmed.length === 0 || trimmed.length > 50) {
      return Response.json(
        { error: "Display name must be 1-50 characters" },
        { status: 400 }
      );
    }
    updates.displayName = trimmed;
  }
  if (body.searchHandle !== undefined) {
    if (typeof body.searchHandle !== "string") {
      return Response.json({ error: "Invalid username" }, { status: 400 });
    }
    const handle = body.searchHandle.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(handle)) {
      return Response.json(
        { error: "invalid_username" },
        { status: 400 }
      );
    }
    updates.searchHandle = handle;
  }
  if (body.avatarUrl !== undefined) {
    if (body.avatarUrl !== null && typeof body.avatarUrl !== "string") {
      return Response.json({ error: "Invalid avatarUrl" }, { status: 400 });
    }
    // Cap data URL size to ~1.5MB encoded (~1MB raw)
    if (typeof body.avatarUrl === "string" && body.avatarUrl.length > 1_500_000) {
      return Response.json(
        { error: "Avatar image is too large" },
        { status: 413 }
      );
    }
    updates.avatarUrl = body.avatarUrl;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No updates" }, { status: 400 });
  }

  updates.updatedAt = new Date();

  try {
    await db.update(users).set(updates).where(eq(users.id, sessionUser.id));
  } catch (err: unknown) {
    // Postgres unique violation = 23505 (e.g. searchHandle conflict)
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as { code?: string }).code
        : undefined;
    if (code === "23505" && updates.searchHandle !== undefined) {
      return Response.json({ error: "username_taken" }, { status: 409 });
    }
    throw err;
  }

  return Response.json({ success: true });
}
