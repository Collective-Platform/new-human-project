"use server";

import { updateTag } from "next/cache";
import { getSessionUser } from "@/src/features/auth";
import { db } from "@/src/db";
import { memberBadges } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";

export async function markBadgeSeen(badgeId: string) {
  const user = await getSessionUser();
  if (!user) return;

  await db
    .update(memberBadges)
    .set({ seenAt: new Date() })
    .where(and(eq(memberBadges.userId, user.id), eq(memberBadges.badgeId, badgeId)));

  updateTag(`dashboard:${user.id}`);
}
