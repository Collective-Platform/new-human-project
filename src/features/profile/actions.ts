'use server';

import { updateTag } from "next/cache";
import { getSessionUser } from "@/src/features/auth";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";

interface NotificationPrefs {
  daily_reminder: boolean;
  reminder_time: string;
  friend_requests: boolean;
}

export async function updateProfile(input: {
  displayName?: string;
  searchHandle?: string;
  avatarUrl?: string | null;
  notificationPrefs?: NotificationPrefs;
  privacyPublic?: boolean;
}): Promise<{ success: true } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const updates: Record<string, unknown> = {};

  if (input.notificationPrefs !== undefined) {
    updates.notificationPrefs = input.notificationPrefs;
  }
  if (input.privacyPublic !== undefined) {
    updates.privacyPublic = input.privacyPublic;
  }
  if (input.displayName !== undefined) {
    if (typeof input.displayName !== "string") {
      return { error: "Invalid displayName" };
    }
    const trimmed = input.displayName.trim();
    if (trimmed.length === 0 || trimmed.length > 50) {
      return { error: "Display name must be 1-50 characters" };
    }
    updates.displayName = trimmed;
  }
  if (input.searchHandle !== undefined) {
    if (typeof input.searchHandle !== "string") {
      return { error: "Invalid username" };
    }
    const handle = input.searchHandle.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(handle)) {
      return { error: "invalid_username" };
    }
    updates.searchHandle = handle;
  }
  if (input.avatarUrl !== undefined) {
    if (input.avatarUrl !== null && typeof input.avatarUrl !== "string") {
      return { error: "Invalid avatarUrl" };
    }
    if (typeof input.avatarUrl === "string" && input.avatarUrl.length > 1_500_000) {
      return { error: "Avatar image is too large" };
    }
    updates.avatarUrl = input.avatarUrl;
  }

  if (Object.keys(updates).length === 0) {
    return { error: "No updates" };
  }

  updates.updatedAt = new Date();

  try {
    await db.update(users).set(updates).where(eq(users.id, user.id));
    updateTag(`profile:${user.id}`);
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as { code?: string }).code
        : undefined;
    if (code === "23505" && updates.searchHandle !== undefined) {
      return { error: "username_taken" };
    }
    throw err;
  }

  return { success: true };
}
