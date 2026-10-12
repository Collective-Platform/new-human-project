"use server";

import { randomBytes } from "node:crypto";
import { and, eq, or } from "drizzle-orm";
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
  users,
} from "@/src/db/schema";
import { getSessionUser } from "@/src/features/auth";
import { getDayTasks } from "@/src/features/content/program";
import { sendPushToUser } from "@/src/features/notifications";
import { isBlockReleased, PROGRAM_DEFAULT_TZ } from "@/src/lib/program-gate";
import {
  getActivePlanMembership,
  getDashboardPlanForUser,
  getFriendsForPlanMember,
  getPlanByInviteCode,
  getPlanCurrentDay,
  getPlanForMember,
  type PlanFriend,
} from "./queries";

type ActionResult<T = undefined> = { success: true } & (T extends undefined ? object : { data: T });
type ActionError = { error: string };

function makeInviteCode() {
  return randomBytes(12).toString("base64url");
}

function validBlock(blockNumber: number) {
  return Number.isInteger(blockNumber) && blockNumber > 0 && getDayTasks(blockNumber, 1).length > 0;
}

export async function createPlan(input: {
  blockNumber: number;
  title?: string;
  mode: "solo" | "friends";
}): Promise<ActionResult<{ planId: string; inviteCode: string }> | ActionError> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };
  if (!validBlock(input.blockNumber)) return { error: "This block is not available." };
  if (input.mode !== "solo" && input.mode !== "friends") return { error: "Choose how to start." };
  if (!isBlockReleased(input.blockNumber, new Date(), PROGRAM_DEFAULT_TZ)) {
    return { error: "This block has not been released yet." };
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
  // A first usable plan gives Home a useful default without overriding a
  // deliberate active selection. This also repairs stale legacy preferences.
  if (!(await getDashboardPlanForUser(user.id))) {
    await db
      .update(users)
      .set({ dashboardPlanId: plan.id, updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }
  updateTag(`plans:${user.id}`);
  updateTag(`dashboard:${user.id}`);
  return { success: true, data: { planId: plan.id, inviteCode } };
}

export async function joinPlan(input: {
  inviteCode: string;
}): Promise<ActionResult<{ planId: string }> | ActionError> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };
  const plan = await getPlanByInviteCode(input.inviteCode);
  if (!plan) return { error: "This invitation is invalid." };
  if (!plan.isGroup) return { error: "This plan is not open to new members." };
  const timezone = decodeURIComponent((await cookies()).get("tz")?.value ?? "UTC");
  if (getPlanCurrentDay(plan.startedAt, timezone) >= 25) {
    return { error: "This plan has finished and its invitation has expired." };
  }

  const existing = await db
    .select({ id: planMembers.id })
    .from(planMembers)
    .where(and(eq(planMembers.planId, plan.id), eq(planMembers.userId, user.id)))
    .limit(1);
  if (existing[0]) {
    await db
      .update(planMembers)
      .set({ status: "active", removedAt: null })
      .where(eq(planMembers.id, existing[0].id));
  } else {
    await db.insert(planMembers).values({ planId: plan.id, userId: user.id });
  }
  updateTag(`plans:${user.id}`);
  updateTag(`plan:${plan.id}`);
  return { success: true, data: { planId: plan.id } };
}

export async function selectDashboardPlan(input: {
  planId: string | null;
}): Promise<ActionResult | ActionError> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  if (input.planId && !(await getActivePlanMembership(input.planId, user.id))) {
    return { error: "This plan is unavailable." };
  }
  if (input.planId) {
    const completed = await db
      .select({ id: planCompletions.id })
      .from(planCompletions)
      .where(and(eq(planCompletions.planId, input.planId), eq(planCompletions.userId, user.id)))
      .limit(1);
    if (completed[0]) return { error: "Completed plans cannot be shown on Home." };
  }

  await db
    .update(users)
    .set({ dashboardPlanId: input.planId, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  updateTag(`dashboard:${user.id}`);
  return { success: true };
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

  await db
    .update(planMembers)
    .set({ status: "removed", removedAt: new Date() })
    .where(and(eq(planMembers.planId, input.planId), eq(planMembers.userId, input.memberId)));
  updateTag(`plans:${input.memberId}`);
  await db
    .update(users)
    .set({ dashboardPlanId: null, updatedAt: new Date() })
    .where(and(eq(users.id, input.memberId), eq(users.dashboardPlanId, input.planId)));
  updateTag(`dashboard:${input.memberId}`);
  updateTag(`plan:${input.planId}`);
  return { success: true };
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

  const [existing] = await db
    .select({ id: planMembers.id, status: planMembers.status })
    .from(planMembers)
    .where(and(eq(planMembers.planId, input.planId), eq(planMembers.userId, input.friendId)))
    .limit(1);
  if (existing?.status === "active") return { success: true, data: { alreadyMember: true } };

  if (existing) {
    await db
      .update(planMembers)
      .set({ status: "active", removedAt: null, joinedAt: new Date() })
      .where(eq(planMembers.id, existing.id));
  } else {
    await db.insert(planMembers).values({ planId: input.planId, userId: input.friendId });
  }

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

  const members = await db
    .select({ userId: planMembers.userId })
    .from(planMembers)
    .where(and(eq(planMembers.planId, input.planId), eq(planMembers.status, "active")));
  const [deletedPlan] = await db
    .delete(plans)
    .where(and(eq(plans.id, input.planId), eq(plans.createdBy, user.id)))
    .returning();
  if (!deletedPlan) return { error: "This plan is unavailable." };
  await db
    .update(users)
    .set({ dashboardPlanId: null, updatedAt: new Date() })
    .where(eq(users.dashboardPlanId, input.planId));

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
    db
      .update(users)
      .set({ dashboardPlanId: null, updatedAt: new Date() })
      .where(and(eq(users.id, user.id), eq(users.dashboardPlanId, input.planId))),
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
