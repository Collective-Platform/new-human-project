'use server';

import { updateTag } from "next/cache";
import { getSessionUser } from "@/src/features/auth";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function completeOnboarding(input: {
  searchHandle: string;
}): Promise<{ success: true } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const handle = input.searchHandle?.trim().toLowerCase();
  if (typeof handle !== "string" || !/^[a-z0-9_]{3,30}$/.test(handle)) {
    return { error: "invalid_username" };
  }

  if (user.onboardedAt) return { success: true };

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
    if (code === "23505") return { error: "username_taken" };
    throw err;
  }

  updateTag(`profile:${user.id}`);
  updateTag(`dashboard:${user.id}`);
  updateTag(`progress:${user.id}`);

  return { success: true };
}
