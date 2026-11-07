import { and, eq } from "drizzle-orm";
import { db } from "@/src/db";
import { planMembers } from "@/src/db/schema";

/**
 * The owner removes a member. Only the status changes: the member's task completions,
 * finished-block record and badge stay, so they return if the owner adds them back.
 * `kicked` (removed by the owner) is not `removed` (the member left): `joinPlan` lets a
 * member who left use the invite link again, but not one the owner removed.
 */
export async function kickMember(planId: string, memberId: number) {
  await db
    .update(planMembers)
    .set({ status: "kicked", removedAt: new Date() })
    .where(and(eq(planMembers.planId, planId), eq(planMembers.userId, memberId)));
}

/**
 * The owner adds a member, or brings back one who left or was removed.
 * Returns `already` when the person is active, `restored` when an old row became active
 * again, and `added` when a new row was made.
 */
export async function reinstateMember(planId: string, memberId: number) {
  const [existing] = await db
    .select({ id: planMembers.id, status: planMembers.status })
    .from(planMembers)
    .where(and(eq(planMembers.planId, planId), eq(planMembers.userId, memberId)))
    .limit(1);
  if (existing?.status === "active") return "already" as const;
  if (existing) {
    await db
      .update(planMembers)
      .set({ status: "active", removedAt: null, joinedAt: new Date() })
      .where(eq(planMembers.id, existing.id));
    return "restored" as const;
  }
  await db.insert(planMembers).values({ planId, userId: memberId });
  return "added" as const;
}
