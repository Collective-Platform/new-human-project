"use server";

import { updateTag } from "next/cache";
import { getSessionUser } from "@/src/features/auth";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { startFoundationPlan } from "@/src/features/plans/actions";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { safeReturnPath } from "@/src/lib/return-path";

export async function completeOnboarding(input: {
  searchHandle: string;
  next?: string | null;
}): Promise<{ success: true; planId?: string } | { error: string }> {
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
      err && typeof err === "object" && "code" in err ? (err as { code?: string }).code : undefined;
    if (code === "23505") return { error: "username_taken" };
    throw err;
  }

  updateTag(`profile:${user.id}`);
  updateTag(`dashboard:${user.id}`);
  updateTag(`progress:${user.id}`);

  // Every new member begins with block 1 (Ephesians). A failure here must not block
  // onboarding: the member can still start a block from the Plans page.
  let planId: string | undefined;
  try {
    const plan = await startFoundationPlan();
    if ("success" in plan) planId = plan.data.planId;
  } catch {}

  // A member who signed up from an invite goes back to it. The redirect must run here:
  // saving the username refreshes the page, and OnboardingGate cannot read the URL.
  const next = safeReturnPath(input.next);
  if (next) redirect(`/${await getLocale()}${next}`);

  return { success: true, ...(planId ? { planId } : {}) };
}
