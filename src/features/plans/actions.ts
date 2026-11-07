"use server";

import { randomBytes } from "node:crypto";
import { and, eq, inArray, or } from "drizzle-orm";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/src/db";
import {
  memberBadges,
  friendRequests,
  planCompletions,
  planDiscussionPosts,
  planMembers,
  plans,
  taskCompletions,
} from "@/src/db/schema";
import { getSessionUser } from "@/src/features/auth";
import { getDayTasks } from "@/src/features/content/program";
import { sendPushToUser } from "@/src/features/notifications";
import {
  copyPastLogsIntoPlan,
  copyTodaysLogsIntoPlan,
  getRequestTimezone,
  keepSharedLogsOfPlan,
} from "@/src/features/tasks/shared-logs";
import { isBlockReleased, PROGRAM_DEFAULT_TZ } from "@/src/lib/program-gate";
import {
  getActivePlanMembership,
  getFriendsForPlanMember,
  getPlanByInviteCode,
  getPlanCurrentDay,
  getPlanForMember,
  getPlansForUser,
  type PlanFriend,
} from "./queries";
import { kickMember, reinstateMember } from "./membership";

type ActionResult<T = undefined> = { success: true } & (T extends undefined ? object : { data: T });
/** `code` lets the screen show a translated message; `error` stays for logs and plain callers. */
export type JoinErrorCode = "signed_out" | "invalid" | "closed" | "expired" | "kicked";
type ActionError = { error: string; code?: JoinErrorCode };

function makeInviteCode() {
  return randomBytes(12).toString("base64url");
}

function validBlock(blockNumber: number) {
  return Number.isInteger(blockNumber) && blockNumber > 0 && getDayTasks(blockNumber, 1).length > 0;
}

/** A member who starts or joins a block mid-day brings today's mood and exercise with them. */
async function copyTodaysLogsBestEffort(
  userId: number,
  plan: { id: string; blockNumber: number; startedAt: Date },
) {
  try {
    await copyTodaysLogsIntoPlan({ userId, plan, timezone: await getRequestTimezone() });
  } catch {
    // The block is already created. A missed copy only means the member logs again.
  }
}

/**
 * A member who joins a running block also brings their mood and exercise from its earlier days.
 * The timezone comes from the request. When an owner adds a friend, that is the owner's timezone,
 * because the app does not save one for each member.
 */
async function copyLogsForNewMemberBestEffort(
  userId: number,
  plan: { id: string; blockNumber: number; startedAt: Date },
) {
  try {
    const timezone = await getRequestTimezone();
    await copyTodaysLogsIntoPlan({ userId, plan, timezone });
    await copyPastLogsIntoPlan({ userId, plan, timezone });
  } catch {
    // The member is already in the block. A missed copy only means they log again.
  }
}

export async function createPlan(input: {
  blockNumber: number;
  title?: string;
  mode: "solo" | "friends";
  friendIds?: number[];
}): Promise<ActionResult<{ planId: string; inviteCode: string }> | ActionError> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };
  if (!validBlock(input.blockNumber)) return { error: "This block is not available." };
  if (input.mode !== "solo" && input.mode !== "friends") return { error: "Choose how to start." };
  if (!isBlockReleased(input.blockNumber, new Date(), PROGRAM_DEFAULT_TZ)) {
    return { error: "This block has not been released yet." };
  }

  if (input.mode === "friends") {
    const friendIds = new Set((await getFriendsForPlanMember(user.id)).map((f) => f.id));
    if (!input.friendIds?.some((id) => friendIds.has(id))) {
      return { error: "Choose at least one friend." };
    }
  }

  const title = input.title?.trim().slice(0, 80) || null;
  const inviteCode = makeInviteCode();
  const [plan] = await db
    .insert(plans)
    .values({
      blockNumber: input.blockNumber,
      createdBy: user.id,
      inviteCode,
      title,
      isGroup: input.mode === "friends",
    })
    .returning();
  await db.insert(planMembers).values({ planId: plan.id, userId: user.id, role: "owner" });

  // Only accepted friends can be added at creation. Unknown ids are ignored.
  if (input.mode === "friends" && input.friendIds?.length) {
    const friendIds = new Set((await getFriendsForPlanMember(user.id)).map((friend) => friend.id));
    const selected = [...new Set(input.friendIds)].filter((id) => friendIds.has(id));
    if (selected.length > 0) {
      await db
        .insert(planMembers)
        .values(selected.map((friendId) => ({ planId: plan.id, userId: friendId })));
      const senderName = user.searchHandle
        ? `@${user.searchHandle}`
        : (user.displayName ?? "Someone");
      const planName = title || `Block ${input.blockNumber}`;
      await Promise.all(selected.map((friendId) => copyLogsForNewMemberBestEffort(friendId, plan)));
      await Promise.all(
        selected.map((friendId) => {
          updateTag(`plans:${friendId}`);
          updateTag(`dashboard:${friendId}`);
          return sendPushToUser(
            friendId,
            {
              title: "Rhythm",
              body: `${senderName} added you to ${planName}`,
              url: `/progress/${plan.id}`,
            },
            "plan_member_added",
          ).catch(() => {});
        }),
      );
    }
  }
  await copyTodaysLogsBestEffort(user.id, plan);
  updateTag(`plans:${user.id}`);
  updateTag(`dashboard:${user.id}`);
  return { success: true, data: { planId: plan.id, inviteCode } };
}

/**
 * Onboarding starts the foundation block (block 1, Ephesians) for a new member.
 * A member who already has a block 1 plan gets that plan back, so a repeated call
 * never creates a second one.
 */
export async function startFoundationPlan(): Promise<
  ActionResult<{ planId: string }> | ActionError
> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };
  const existing = (await getPlansForUser(user.id)).find((plan) => plan.blockNumber === 1);
  if (existing) return { success: true, data: { planId: existing.id } };
  const result = await createPlan({ blockNumber: 1, mode: "solo" });
  if ("error" in result) return result;
  return { success: true, data: { planId: result.data.planId } };
}

export async function joinPlan(input: {
  inviteCode: string;
}): Promise<ActionResult<{ planId: string }> | ActionError> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized", code: "signed_out" };
  const plan = await getPlanByInviteCode(input.inviteCode);
  if (!plan) return { error: "This invitation is invalid.", code: "invalid" };
  if (!plan.isGroup) return { error: "This plan is not open to new members.", code: "closed" };
  const timezone = decodeURIComponent((await cookies()).get("tz")?.value ?? "UTC");
  if (getPlanCurrentDay(plan.startedAt, timezone) >= 25) {
    return { error: "This plan has finished and its invitation has expired.", code: "expired" };
  }

  const existing = await db
    .select({ id: planMembers.id, status: planMembers.status })
    .from(planMembers)
    .where(and(eq(planMembers.planId, plan.id), eq(planMembers.userId, user.id)))
    .limit(1);
  // Only the owner can bring back a member they removed (see addFriendToPlan).
  if (existing[0]?.status === "kicked") {
    return { error: "The plan creator removed you from this plan.", code: "kicked" };
  }
  // A member who is already active only reopened the link, so their row stays as it is.
  if (existing[0] && existing[0].status !== "active") {
    await db
      .update(planMembers)
      .set({ status: "active", removedAt: null, joinedAt: new Date() })
      .where(eq(planMembers.id, existing[0].id));
  } else if (!existing[0]) {
    await db.insert(planMembers).values({ planId: plan.id, userId: user.id });
  }
  // A member who is already active only reopened the link. Do not refill a log they removed.
  if (existing[0]?.status === "active") await copyTodaysLogsBestEffort(user.id, plan);
  else await copyLogsForNewMemberBestEffort(user.id, plan);
  updateTag(`plans:${user.id}`);
  updateTag(`dashboard:${user.id}`);
  updateTag(`plan:${plan.id}`);
  return { success: true, data: { planId: plan.id } };
}

export async function removePlanMember(input: {
  planId: string;
  memberId: number;
}): Promise<ActionResult | ActionError> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };
  const membership = await getActivePlanMembership(input.planId, user.id);
  if (membership?.role !== "owner")
    return { error: "Only the plan creator can remove participants." };
  if (input.memberId === user.id) return { error: "The plan creator cannot be removed." };

  await kickMember(input.planId, input.memberId);
  updateTag(`plans:${input.memberId}`);
  updateTag(`dashboard:${input.memberId}`);
  updateTag(`plan:${input.planId}`);
  return { success: true };
}

/** Friends the user can pick while creating a new group plan. */
export async function getFriendsForNewPlan(): Promise<ActionResult<PlanFriend[]> | ActionError> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };
  return { success: true, data: await getFriendsForPlanMember(user.id) };
}

export async function getPlanFriendsForAdding(input: {
  planId: string;
}): Promise<ActionResult<PlanFriend[]> | ActionError> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };
  const planState = await getPlanForMember(input.planId, user.id);
  if (!planState?.plan.isGroup || planState.membership.role !== "owner") {
    return { error: "Only the plan creator can add participants." };
  }
  return { success: true, data: await getFriendsForPlanMember(user.id) };
}

export async function addFriendToPlan(input: {
  planId: string;
  friendId: number;
}): Promise<ActionResult<{ alreadyMember: boolean }> | ActionError> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };
  if (!Number.isInteger(input.friendId) || input.friendId <= 0 || input.friendId === user.id) {
    return { error: "Choose a valid friend." };
  }

  const planState = await getPlanForMember(input.planId, user.id);
  if (!planState?.plan.isGroup || planState.membership.role !== "owner") {
    return { error: "Only the plan creator can add participants." };
  }
  const timezone = decodeURIComponent((await cookies()).get("tz")?.value ?? "UTC");
  if (getPlanCurrentDay(planState.plan.startedAt, timezone) >= 25) {
    return { error: "This plan has finished and cannot accept new participants." };
  }

  const [friendship] = await db
    .select({ id: friendRequests.id })
    .from(friendRequests)
    .where(
      and(
        eq(friendRequests.status, "accepted"),
        or(
          and(eq(friendRequests.senderId, user.id), eq(friendRequests.receiverId, input.friendId)),
          and(eq(friendRequests.senderId, input.friendId), eq(friendRequests.receiverId, user.id)),
        ),
      ),
    )
    .limit(1);
  if (!friendship) return { error: "You can only add your friends to this plan." };

  if ((await reinstateMember(input.planId, input.friendId)) === "already") {
    return { success: true, data: { alreadyMember: true } };
  }
  await copyLogsForNewMemberBestEffort(input.friendId, planState.plan);

  const senderName = user.searchHandle ? `@${user.searchHandle}` : (user.displayName ?? "Someone");
  const planName = planState.plan.title?.trim() || `Block ${planState.plan.blockNumber}`;
  await sendPushToUser(
    input.friendId,
    {
      title: "Rhythm",
      body: `${senderName} added you to ${planName}`,
      url: `/progress/${input.planId}`,
    },
    "plan_member_added",
  ).catch(() => {});

  updateTag(`plans:${input.friendId}`);
  updateTag(`dashboard:${input.friendId}`);
  updateTag(`plan:${input.planId}`);
  return { success: true, data: { alreadyMember: false } };
}

/** Permanently remove an owner-created plan and every record attached to it. */
export async function deleteOwnedPlan(input: {
  planId: string;
}): Promise<ActionResult | ActionError> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const planState = await getPlanForMember(input.planId, user.id);
  if (!planState) return { error: "This plan is unavailable." };
  if (planState.membership.role !== "owner" || planState.plan.createdBy !== user.id) {
    return { error: "Only the plan creator can delete this plan." };
  }

  // Removed (`kicked`) members keep their rows in the plan, so their logs need the same care.
  // Members who left already went through keepSharedLogsOfPlan when they left.
  const members = await db
    .select({ userId: planMembers.userId })
    .from(planMembers)
    .where(
      and(eq(planMembers.planId, input.planId), inArray(planMembers.status, ["active", "kicked"])),
    );
  await keepSharedLogsOfPlan({
    planId: input.planId,
    userIds: members.map((member) => member.userId),
    timezone: await getRequestTimezone(),
  });
  const [deletedPlan] = await db
    .delete(plans)
    .where(and(eq(plans.id, input.planId), eq(plans.createdBy, user.id)))
    .returning();
  if (!deletedPlan) return { error: "This plan is unavailable." };

  for (const member of members) {
    updateTag(`dashboard:${member.userId}`);
    updateTag(`plans:${member.userId}`);
  }
  updateTag(`plan:${input.planId}`);
  return { success: true };
}

/** Remove a member and their records from a shared plan without affecting anyone else. */
export async function leaveGroupPlan(input: {
  planId: string;
}): Promise<ActionResult | ActionError> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const planState = await getPlanForMember(input.planId, user.id);
  if (!planState) return { error: "This plan is unavailable." };
  if (!planState.plan.isGroup) return { error: "Only shared plans can be left." };
  if (planState.membership.role === "owner") {
    return { error: "The plan creator cannot leave the group." };
  }

  const [removedMembership] = await db
    .update(planMembers)
    .set({ status: "removed", removedAt: new Date() })
    .where(
      and(
        eq(planMembers.planId, input.planId),
        eq(planMembers.userId, user.id),
        eq(planMembers.status, "active"),
      ),
    )
    .returning();
  if (!removedMembership) return { error: "This plan is unavailable." };

  await keepSharedLogsOfPlan({
    planId: input.planId,
    userIds: [user.id],
    timezone: await getRequestTimezone(),
  });
  await Promise.all([
    db
      .delete(taskCompletions)
      .where(and(eq(taskCompletions.planId, input.planId), eq(taskCompletions.userId, user.id))),
    db
      .delete(planCompletions)
      .where(and(eq(planCompletions.planId, input.planId), eq(planCompletions.userId, user.id))),
    db
      .delete(memberBadges)
      .where(and(eq(memberBadges.planId, input.planId), eq(memberBadges.userId, user.id))),
  ]);

  updateTag(`dashboard:${user.id}`);
  updateTag(`plans:${user.id}`);
  updateTag(`plan:${input.planId}`);
  return { success: true };
}

export async function createPlanDiscussionPost(input: {
  planId: string;
  dayNumber: number;
  body: string;
  parentId?: string;
}): Promise<ActionResult<{ id: string }> | ActionError> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };
  if (!Number.isInteger(input.dayNumber) || input.dayNumber < 1 || input.dayNumber > 25) {
    return { error: "Invalid plan day." };
  }
  const body = input.body.trim();
  if (!body || body.length > 1_000)
    return { error: "A takeaway must be between 1 and 1,000 characters." };
  if (!(await getActivePlanMembership(input.planId, user.id)))
    return { error: "You are not in this plan." };
  const [plan] = await db
    .select({ isGroup: plans.isGroup })
    .from(plans)
    .where(eq(plans.id, input.planId))
    .limit(1);
  if (!plan?.isGroup) return { error: "Discussion is only available for group plans." };

  let parentUserId: number | null = null;
  if (input.parentId) {
    const [parent] = await db
      .select({ userId: planDiscussionPosts.userId, parentId: planDiscussionPosts.parentId })
      .from(planDiscussionPosts)
      .where(
        and(
          eq(planDiscussionPosts.id, input.parentId),
          eq(planDiscussionPosts.planId, input.planId),
          eq(planDiscussionPosts.dayNumber, input.dayNumber),
        ),
      )
      .limit(1);
    if (!parent || parent.parentId)
      return { error: "Replies can only be added to a discussion post." };
    parentUserId = parent.userId;
  }

  const [post] = await db
    .insert(planDiscussionPosts)
    .values({
      planId: input.planId,
      dayNumber: input.dayNumber,
      userId: user.id,
      parentId: input.parentId ?? null,
      body,
    })
    .returning();

  if (parentUserId && parentUserId !== user.id) {
    const senderName = user.searchHandle
      ? `@${user.searchHandle}`
      : (user.displayName ?? "Someone");
    sendPushToUser(
      parentUserId,
      {
        title: "Rhythm",
        body: `${senderName} replied to your takeaway`,
        url: `/progress/${input.planId}`,
      },
      "discussion_reply",
    ).catch(() => {});
  }
  updateTag(`plan:${input.planId}`);
  return { success: true, data: { id: post.id } };
}

export async function deletePlanDiscussionPost(input: {
  planId: string;
  postId: string;
}): Promise<ActionResult | ActionError> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };
  if (!(await getActivePlanMembership(input.planId, user.id)))
    return { error: "You are not in this plan." };

  const result = await db
    .update(planDiscussionPosts)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(planDiscussionPosts.id, input.postId),
        eq(planDiscussionPosts.planId, input.planId),
        eq(planDiscussionPosts.userId, user.id),
      ),
    )
    .returning();
  if (!result[0]) return { error: "That post is unavailable." };
  updateTag(`plan:${input.planId}`);
  return { success: true };
}
