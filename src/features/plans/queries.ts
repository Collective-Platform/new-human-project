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

import { PLAN_LENGTH_DAYS, getPlanCurrentDay } from "./dates";

export {
  PLAN_LENGTH_DAYS,
  getPlanCurrentDay,
  getPlanDayDate,
  getPlanDayOnDate,
  isPlanPastLastDay,
} from "./dates";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Plan ids can come from a URL. Postgres throws on a value that is not a UUID. */
export function isPlanId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

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

/** A member's status in a plan (active | removed | kicked), or null if they never joined. */
export async function getPlanMemberStatus(planId: string, userId: number) {
  const rows = await db
    .select({ status: planMembers.status })
    .from(planMembers)
    .where(and(eq(planMembers.planId, planId), eq(planMembers.userId, userId)))
    .limit(1);
  return rows[0]?.status ?? null;
}

export async function getPlanByInviteCode(inviteCode: string) {
  const rows = await db.select().from(plans).where(eq(plans.inviteCode, inviteCode)).limit(1);
  return rows[0] ?? null;
}

export async function getPlanForMember(planId: string, userId: number) {
  if (!isPlanId(planId)) return null;
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

export type PlanCardMember = {
  id: number;
  displayName: string | null;
  searchHandle: string | null;
  avatarUrl: string | null;
  completedToday: boolean;
};

export type PlanCardProgress = {
  currentDay: number;
  totalDays: number;
  todayTotal: number;
  todayDone: number;
  /** Other members of a shared plan, at most `CARD_MEMBER_PREVIEW` of them. */
  members: PlanCardMember[];
};

const CARD_MEMBER_PREVIEW = 3;

/**
 * Today's status for each plan card on the plans list.
 * Every member is judged against the viewer's current plan day, so the dots
 * answer "who has done today's tasks?" from the viewer's point of view.
 */
export async function getPlanCardProgress(
  userId: number,
  timezone: string,
  cards: { id: string; blockNumber: number; startedAt: Date; isGroup: boolean }[],
): Promise<Map<string, PlanCardProgress>> {
  const result = new Map<string, PlanCardProgress>();
  if (cards.length === 0) return result;

  const expectedByPlan = new Map<string, { day: number; taskIds: Set<string> }>();
  const allTaskIds = new Set<string>();
  for (const card of cards) {
    const day = getPlanCurrentDay(card.startedAt, timezone);
    const taskIds = new Set(getDayTasks(card.blockNumber, day).map((task) => task.id));
    expectedByPlan.set(card.id, { day, taskIds });
    for (const id of taskIds) allTaskIds.add(id);
  }

  const planIds = cards.map((card) => card.id);
  const groupPlanIds = cards.filter((card) => card.isGroup).map((card) => card.id);
  const [completions, memberRows] = await Promise.all([
    allTaskIds.size === 0
      ? Promise.resolve([])
      : db
          .select({
            planId: taskCompletions.planId,
            userId: taskCompletions.userId,
            taskId: taskCompletions.taskId,
          })
          .from(taskCompletions)
          .where(
            and(
              inArray(taskCompletions.planId, planIds),
              inArray(taskCompletions.taskId, [...allTaskIds]),
            ),
          ),
    groupPlanIds.length === 0
      ? Promise.resolve([])
      : db
          .select({
            planId: planMembers.planId,
            id: users.id,
            displayName: users.displayName,
            searchHandle: users.searchHandle,
            avatarUrl: users.avatarUrl,
          })
          .from(planMembers)
          .innerJoin(users, eq(planMembers.userId, users.id))
          .where(
            and(
              inArray(planMembers.planId, groupPlanIds),
              eq(planMembers.status, "active"),
              sql`${planMembers.userId} <> ${userId}`,
            ),
          )
          .orderBy(asc(users.displayName)),
  ]);

  const doneByPlanUser = new Map<string, Set<string>>();
  for (const completion of completions) {
    if (!completion.planId) continue;
    const key = `${completion.planId}:${completion.userId}`;
    const done = doneByPlanUser.get(key) ?? new Set<string>();
    done.add(completion.taskId);
    doneByPlanUser.set(key, done);
  }

  function doneCount(planId: string, memberId: number, taskIds: Set<string>) {
    const done = doneByPlanUser.get(`${planId}:${memberId}`);
    if (!done) return 0;
    let count = 0;
    for (const id of taskIds) if (done.has(id)) count += 1;
    return count;
  }

  for (const card of cards) {
    const expected = expectedByPlan.get(card.id);
    if (!expected) continue;
    const members = memberRows
      .filter((row) => row.planId === card.id)
      .slice(0, CARD_MEMBER_PREVIEW)
      .map((row) => ({
        id: row.id,
        displayName: row.displayName,
        searchHandle: row.searchHandle,
        avatarUrl: row.avatarUrl,
        completedToday:
          expected.taskIds.size > 0 &&
          doneCount(card.id, row.id, expected.taskIds) === expected.taskIds.size,
      }));
    result.set(card.id, {
      currentDay: expected.day,
      totalDays: PLAN_LENGTH_DAYS,
      todayTotal: expected.taskIds.size,
      todayDone: doneCount(card.id, userId, expected.taskIds),
      members,
    });
  }
  return result;
}

function safeTimezone(tz: string): string {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

/**
 * Final streak of each plan: the length of the consecutive-day chain that ends
 * on the member's last active day in that plan. Plans with no activity are missing from the map.
 */
export async function getPlanFinalStreaks(
  userId: number,
  planIds: string[],
  timezone: string,
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (planIds.length === 0) return result;
  const tz = safeTimezone(timezone);
  const idList = sql.join(
    planIds.map((id) => sql`${id}::uuid`),
    sql`, `,
  );
  const queried = await db.execute<{ plan_id: string; streak: number }>(sql`
    WITH completion_dates AS (
      SELECT DISTINCT tc.plan_id, (tc.completed_at AT TIME ZONE ${tz})::date AS d
      FROM nhp.task_completions tc
      WHERE tc.user_id = ${userId} AND tc.plan_id IN (${idList})
    ),
    numbered AS (
      SELECT plan_id, d, d - (ROW_NUMBER() OVER (PARTITION BY plan_id ORDER BY d ASC))::int AS grp
      FROM completion_dates
    ),
    last_chain AS (
      SELECT DISTINCT ON (plan_id) plan_id, grp FROM numbered ORDER BY plan_id, d DESC
    )
    SELECT n.plan_id, COUNT(*)::int AS streak
    FROM numbered n
    JOIN last_chain l ON l.plan_id = n.plan_id AND l.grp = n.grp
    GROUP BY n.plan_id
  `);
  const rows = (queried as unknown as { rows: { plan_id: string; streak: number }[] }).rows;
  for (const row of rows) result.set(row.plan_id, Number(row.streak));
  return result;
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
