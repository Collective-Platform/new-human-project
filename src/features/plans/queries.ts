import { and, asc, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/src/db";
import {
  planCompletions,
  planDiscussionPosts,
  planMembers,
  plans,
  taskCompletions,
  users,
} from "@/src/db/schema";
import { getDayTasks } from "@/src/features/content/program";

export const PLAN_LENGTH_DAYS = 25;

export type PlanMember = {
  id: number;
  displayName: string | null;
  searchHandle: string | null;
  avatarUrl: string | null;
  completed: boolean;
  role: string;
};

export type PlanFriend = {
  id: number;
  displayName: string | null;
  searchHandle: string | null;
  avatarUrl: string | null;
};

/** Friends are loaded only when a group owner opens the member picker. */
export async function getFriendsForPlanMember(userId: number): Promise<PlanFriend[]> {
  const result = await db.execute(sql`
    SELECT u.id, u.display_name, u.search_handle, u.avatar_url
    FROM nhp.friend_requests fr
    JOIN nhp.users u ON u.id = CASE
      WHEN fr.sender_id = ${userId} THEN fr.receiver_id
      ELSE fr.sender_id
    END
    WHERE fr.status = 'accepted'
      AND (fr.sender_id = ${userId} OR fr.receiver_id = ${userId})
    ORDER BY u.search_handle, u.display_name
  `);

  return (
    result.rows as {
      id: number;
      display_name: string | null;
      search_handle: string | null;
      avatar_url: string | null;
    }[]
  ).map((row) => ({
    id: Number(row.id),
    displayName: row.display_name,
    searchHandle: row.search_handle,
    avatarUrl: row.avatar_url,
  }));
}

function dateAtTimezone(date: Date, timezone: string): Date {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    return new Date(Date.UTC(value("year"), value("month") - 1, value("day")));
  } catch {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }
}

/** Each participant advances according to their own local calendar. */
export function getPlanCurrentDay(startedAt: Date, timezone: string, now = new Date()): number {
  const start = dateAtTimezone(startedAt, timezone);
  const today = dateAtTimezone(now, timezone);
  const elapsed = Math.floor((today.getTime() - start.getTime()) / 86_400_000);
  return Math.min(Math.max(elapsed + 1, 1), PLAN_LENGTH_DAYS);
}

export async function getActivePlanMembership(planId: string, userId: number) {
  const rows = await db
    .select({ id: planMembers.id, role: planMembers.role })
    .from(planMembers)
    .where(
      and(
        eq(planMembers.planId, planId),
        eq(planMembers.userId, userId),
        eq(planMembers.status, "active"),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function getPlanByInviteCode(inviteCode: string) {
  const rows = await db.select().from(plans).where(eq(plans.inviteCode, inviteCode)).limit(1);
  return rows[0] ?? null;
}

export async function getPlanForMember(planId: string, userId: number) {
  const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  if (!plan) return null;
  const membership = await getActivePlanMembership(planId, userId);
  return membership ? { plan, membership } : null;
}

export async function getPlansForUser(userId: number) {
  const rows = await db
    .select({
      id: plans.id,
      blockNumber: plans.blockNumber,
      title: plans.title,
      isGroup: plans.isGroup,
      startedAt: plans.startedAt,
      createdBy: plans.createdBy,
      role: planMembers.role,
      completedAt: planCompletions.completedAt,
    })
    .from(planMembers)
    .innerJoin(plans, eq(planMembers.planId, plans.id))
    .leftJoin(
      planCompletions,
      and(eq(planCompletions.planId, plans.id), eq(planCompletions.userId, userId)),
    )
    .where(and(eq(planMembers.userId, userId), eq(planMembers.status, "active")))
    .orderBy(desc(plans.startedAt));
  const planIds = rows.map((row) => row.id);
  if (planIds.length === 0) return rows.map((row) => ({ ...row, memberCount: 0 }));
  const counts = await db
    .select({ planId: planMembers.planId, value: count() })
    .from(planMembers)
    .where(and(inArray(planMembers.planId, planIds), eq(planMembers.status, "active")))
    .groupBy(planMembers.planId);
  const byPlan = new Map(counts.map((row) => [row.planId, row.value]));
  return rows.map((row) => ({ ...row, memberCount: byPlan.get(row.id) ?? 0 }));
}

export async function getCompletedPlansForUser(userId: number) {
  return db
    .select({
      id: plans.id,
      blockNumber: plans.blockNumber,
      title: plans.title,
      completedAt: planCompletions.completedAt,
    })
    .from(planCompletions)
    .innerJoin(plans, eq(planCompletions.planId, plans.id))
    .where(eq(planCompletions.userId, userId))
    .orderBy(desc(planCompletions.completedAt));
}

/** The member-approved plan used for their personal Home dashboard. */
export async function getDashboardPlanForUser(userId: number) {
  const rows = await db
    .select({
      id: plans.id,
      blockNumber: plans.blockNumber,
      title: plans.title,
      isGroup: plans.isGroup,
      startedAt: plans.startedAt,
    })
    .from(users)
    .innerJoin(plans, eq(users.dashboardPlanId, plans.id))
    .innerJoin(
      planMembers,
      and(
        eq(planMembers.planId, plans.id),
        eq(planMembers.userId, userId),
        eq(planMembers.status, "active"),
      ),
    )
    .leftJoin(
      planCompletions,
      and(eq(planCompletions.planId, plans.id), eq(planCompletions.userId, userId)),
    )
    .where(and(eq(users.id, userId), isNull(planCompletions.id)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPlanMembersForDay(
  planId: string,
  dayNumber: number,
): Promise<PlanMember[]> {
  const [members, completions] = await Promise.all([
    db
      .select({
        id: users.id,
        displayName: users.displayName,
        searchHandle: users.searchHandle,
        avatarUrl: users.avatarUrl,
        role: planMembers.role,
      })
      .from(planMembers)
      .innerJoin(users, eq(planMembers.userId, users.id))
      .where(and(eq(planMembers.planId, planId), eq(planMembers.status, "active")))
      .orderBy(asc(users.displayName)),
    db
      .select({ userId: taskCompletions.userId, taskId: taskCompletions.taskId })
      .from(taskCompletions)
      .where(eq(taskCompletions.planId, planId)),
  ]);

  const expectedTaskIds = new Set<string>();
  // The immutable markdown registry remains the completion source of truth.
  const planRows = await db
    .select({ blockNumber: plans.blockNumber })
    .from(plans)
    .where(eq(plans.id, planId));
  const blockNumber = planRows[0]?.blockNumber;
  if (blockNumber) {
    for (const task of getDayTasks(blockNumber, dayNumber)) expectedTaskIds.add(task.id);
  }

  const completedByUser = new Map<number, Set<string>>();
  for (const completion of completions) {
    if (!expectedTaskIds.has(completion.taskId)) continue;
    const ids = completedByUser.get(completion.userId) ?? new Set<string>();
    ids.add(completion.taskId);
    completedByUser.set(completion.userId, ids);
  }

  return members.map((member) => ({
    ...member,
    completed:
      expectedTaskIds.size > 0 &&
      (completedByUser.get(member.id)?.size ?? 0) === expectedTaskIds.size,
  }));
}

export type PlanDiscussionThread = {
  id: string;
  body: string;
  createdAt: string;
  user: {
    id: number;
    displayName: string | null;
    searchHandle: string | null;
    avatarUrl: string | null;
  };
  replies: Array<{
    id: string;
    body: string;
    createdAt: string;
    user: {
      id: number;
      displayName: string | null;
      searchHandle: string | null;
      avatarUrl: string | null;
    };
  }>;
};

export async function getPlanDiscussion(
  planId: string,
  dayNumber: number,
): Promise<PlanDiscussionThread[]> {
  const rows = await db
    .select({
      id: planDiscussionPosts.id,
      body: planDiscussionPosts.body,
      createdAt: planDiscussionPosts.createdAt,
      parentId: planDiscussionPosts.parentId,
      userId: users.id,
      displayName: users.displayName,
      searchHandle: users.searchHandle,
      avatarUrl: users.avatarUrl,
    })
    .from(planDiscussionPosts)
    .innerJoin(users, eq(planDiscussionPosts.userId, users.id))
    .where(
      and(
        eq(planDiscussionPosts.planId, planId),
        eq(planDiscussionPosts.dayNumber, dayNumber),
        isNull(planDiscussionPosts.deletedAt),
      ),
    )
    .orderBy(asc(planDiscussionPosts.createdAt));

  const threads = new Map<string, PlanDiscussionThread>();
  for (const row of rows) {
    const post = {
      id: row.id,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      user: {
        id: row.userId,
        displayName: row.displayName,
        searchHandle: row.searchHandle,
        avatarUrl: row.avatarUrl,
      },
    };
    if (!row.parentId) {
      threads.set(row.id, { ...post, replies: [] });
    } else {
      threads.get(row.parentId)?.replies.push(post);
    }
  }
  return [...threads.values()];
}
