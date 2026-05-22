import { db } from "@/src/db";
import { friendRequests, likes } from "@/src/db/schema";
import { eq, and, sql, inArray, count } from "drizzle-orm";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";
import { getLocalizedString } from "@/src/features/content";

// --- Friends list (accepted) ---

export async function getFriends(userId: number) {
  const result = await db.execute(sql`
    WITH unique_friends AS (
      SELECT DISTINCT CASE
        WHEN sender_id = ${userId} THEN receiver_id
        ELSE sender_id
      END AS friend_id
      FROM nhp.friend_requests
      WHERE status = 'accepted'
        AND (sender_id = ${userId} OR receiver_id = ${userId})
    )
    SELECT
      u.id,
      u.display_name,
      u.search_handle,
      u.avatar_url,
      (
        SELECT tc.completed_at
        FROM nhp.task_completions tc
        WHERE tc.user_id = u.id
        ORDER BY tc.completed_at DESC
        LIMIT 1
      ) AS last_activity
    FROM unique_friends uf
    JOIN nhp.users u ON u.id = uf.friend_id
    ORDER BY u.search_handle, u.display_name
  `);

  return result.rows as {
    id: number;
    display_name: string | null;
    search_handle: string | null;
    avatar_url: string | null;
    last_activity: string | null;
  }[];
}

// --- Pending incoming friend requests ---

export async function getIncomingRequests(userId: number) {
  const result = await db.execute(sql`
    SELECT
      fr.id AS request_id,
      u.id AS user_id,
      u.display_name,
      u.search_handle,
      u.avatar_url,
      fr.created_at
    FROM nhp.friend_requests fr
    JOIN nhp.users u ON u.id = fr.sender_id
    WHERE fr.receiver_id = ${userId}
      AND fr.status = 'pending'
    ORDER BY fr.created_at DESC
  `);

  return result.rows as {
    request_id: string;
    user_id: number;
    display_name: string | null;
    search_handle: string | null;
    avatar_url: string | null;
    created_at: string;
  }[];
}

// --- Send friend request ---

export async function sendFriendRequest(senderId: number, receiverId: number) {
  // Don't allow self-requests
  if (senderId === receiverId) return null;

  try {
    const rows = await db
      .insert(friendRequests)
      .values({
        senderId,
        receiverId,
        status: "pending",
      })
      .returning();
    return rows[0];
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const cause = err instanceof Error ? (err as { cause?: unknown }).cause : null;
    const causeCode = (cause as { code?: string } | null)?.code ?? "";
    const causeMessage = cause instanceof Error ? cause.message : "";
    if (
      message.includes("unique") ||
      message.includes("duplicate") ||
      message.includes("23505") ||
      causeCode === "23505" ||
      causeMessage.includes("unique") ||
      causeMessage.includes("duplicate")
    ) {
      return null; // Already exists
    }
    throw err;
  }
}

// --- Accept friend request ---

export async function acceptFriendRequest(requestId: string, receiverId: number) {
  const rows = await db
    .update(friendRequests)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(
      and(
        eq(friendRequests.id, requestId),
        eq(friendRequests.receiverId, receiverId),
        eq(friendRequests.status, "pending"),
      ),
    )
    .returning();
  return rows[0] ?? null;
}

// --- Get IDs of users to whom userId has sent a pending request ---

export async function getSentRequestIds(userId: number): Promise<number[]> {
  const result = await db.execute(sql`
    SELECT receiver_id AS id FROM nhp.friend_requests
    WHERE sender_id = ${userId} AND status = 'pending'
  `);
  return (result.rows as { id: number }[]).map((r) => Number(r.id));
}

// --- Cancel (withdraw) a pending outgoing friend request ---

export async function cancelFriendRequest(senderId: number, receiverId: number) {
  await db.execute(sql`
    DELETE FROM nhp.friend_requests
    WHERE sender_id = ${senderId} AND receiver_id = ${receiverId} AND status = 'pending'
  `);
}

// --- Remove friend (delete accepted relationship) ---

export async function removeFriendInDb(userId: number, friendId: number) {
  await db.execute(sql`
    DELETE FROM nhp.friend_requests
    WHERE status = 'accepted'
      AND (
        (sender_id = ${userId} AND receiver_id = ${friendId})
        OR (sender_id = ${friendId} AND receiver_id = ${userId})
      )
  `);
}

// --- Reject friend request ---

export async function rejectFriendRequest(requestId: string, receiverId: number) {
  const rows = await db
    .update(friendRequests)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(
      and(
        eq(friendRequests.id, requestId),
        eq(friendRequests.receiverId, receiverId),
        eq(friendRequests.status, "pending"),
      ),
    )
    .returning();
  return rows[0] ?? null;
}

// --- Lookup profile by searchHandle ---

export async function getPublicProfileByHandle(handle: string): Promise<{
  id: number;
  displayName: string | null;
  searchHandle: string | null;
  avatarUrl: string | null;
} | null> {
  const result = await db.execute(sql`
    SELECT id, display_name, search_handle, avatar_url
    FROM nhp.users
    WHERE search_handle = ${handle}
  `);

  const row = (
    result.rows as {
      id: number;
      display_name: string | null;
      search_handle: string | null;
      avatar_url: string | null;
    }[]
  )[0];
  if (!row) return null;

  return {
    id: row.id,
    displayName: row.display_name,
    searchHandle: row.search_handle,
    avatarUrl: row.avatar_url,
  };
}

// --- Search users by handle or display name ---

export async function searchUsers(query: string, currentUserId: number) {
  const pattern = `%${query}%`;
  const result = await db.execute(sql`
    SELECT
      u.id,
      u.display_name,
      u.avatar_url,
      u.search_handle,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM nhp.friend_requests fr
          WHERE fr.status = 'accepted'
            AND ((fr.sender_id = ${currentUserId} AND fr.receiver_id = u.id)
              OR (fr.sender_id = u.id AND fr.receiver_id = ${currentUserId}))
        ) THEN 'friends'
        WHEN EXISTS (
          SELECT 1 FROM nhp.friend_requests fr
          WHERE fr.sender_id = ${currentUserId}
            AND fr.receiver_id = u.id
            AND fr.status = 'pending'
        ) THEN 'sent'
        ELSE 'none'
      END AS connection_status
    FROM nhp.users u
    WHERE u.id != ${currentUserId}
      AND (
        u.search_handle ILIKE ${pattern}
        OR u.display_name ILIKE ${pattern}
      )
    ORDER BY u.display_name
    LIMIT 20
  `);

  return result.rows as {
    id: number;
    display_name: string | null;
    avatar_url: string | null;
    search_handle: string | null;
    connection_status: "none" | "sent" | "friends";
  }[];
}

// --- People you may know (mutual friends) ---

export async function getPeopleYouMayKnow(userId: number) {
  const result = await db.execute(sql`
    WITH user_friends AS (
      SELECT CASE WHEN sender_id = ${userId} THEN receiver_id ELSE sender_id END AS friend_id
      FROM nhp.friend_requests
      WHERE status = 'accepted'
        AND (sender_id = ${userId} OR receiver_id = ${userId})
    ),
    friends_of_friends AS (
      SELECT
        CASE WHEN fr.sender_id = uf.friend_id THEN fr.receiver_id ELSE fr.sender_id END AS potential_id,
        uf.friend_id AS via_friend_id
      FROM user_friends uf
      JOIN nhp.friend_requests fr
        ON fr.status = 'accepted'
        AND (fr.sender_id = uf.friend_id OR fr.receiver_id = uf.friend_id)
    )
    SELECT u.id, u.display_name, u.search_handle, u.avatar_url,
           COUNT(DISTINCT fof.via_friend_id) AS mutual_count
    FROM friends_of_friends fof
    JOIN nhp.users u ON u.id = fof.potential_id
    WHERE fof.potential_id != ${userId}
      AND fof.potential_id NOT IN (SELECT friend_id FROM user_friends)
    GROUP BY u.id, u.display_name, u.search_handle, u.avatar_url
    HAVING COUNT(DISTINCT fof.via_friend_id) >= 1
    ORDER BY mutual_count DESC, u.search_handle
    LIMIT 10
  `);

  return result.rows as {
    id: number;
    display_name: string | null;
    search_handle: string | null;
    avatar_url: string | null;
    mutual_count: number;
  }[];
}

// --- Single user's recent activities (for profile page) ---

export async function getUserActivities(
  viewerUserId: number,
  targetUserId: number,
): Promise<
  {
    completionId: string;
    userId: number;
    taskId: string;
    completedAtMs: number;
    completionData: Record<string, unknown> | null;
    dbTaskType: string | null;
    dbCategory: string | null;
  }[]
> {
  const result = await db.execute(sql`
    SELECT tc.id, tc.user_id, tc.task_id, tc.completed_at, tc.data,
           bdt.task_type, bdt.category
    FROM nhp.task_completions tc
    JOIN nhp.users u ON tc.user_id = u.id
    LEFT JOIN nhp.block_day_tasks bdt ON bdt.id::text = tc.task_id
    WHERE tc.user_id = ${targetUserId}
      AND (
        ${viewerUserId} = ${targetUserId}
        OR u.privacy_public = true
        OR EXISTS (
          SELECT 1 FROM nhp.friend_requests fr
          WHERE fr.status = 'accepted'
            AND (
              (fr.sender_id = ${viewerUserId} AND fr.receiver_id = ${targetUserId})
              OR (fr.sender_id = ${targetUserId} AND fr.receiver_id = ${viewerUserId})
            )
        )
      )
    ORDER BY tc.completed_at DESC
    LIMIT 20
  `);

  return (
    result.rows as {
      id: string;
      user_id: number;
      task_id: string;
      completed_at: string;
      data: Record<string, unknown> | null;
      task_type: string | null;
      category: string | null;
    }[]
  ).map((row) => ({
    completionId: row.id,
    userId: row.user_id,
    taskId: row.task_id,
    completedAtMs: new Date(row.completed_at).getTime(),
    completionData: row.data ?? null,
    dbTaskType: row.task_type ?? null,
    dbCategory: row.category ?? null,
  }));
}

// --- Paginated activity feed (friends only, cursor-based) ---

export async function getActivityFeedPaged(
  userId: number,
  { limit, cursor }: { limit: number; cursor?: string },
) {
  const cursorClause = cursor ? sql`AND tc.completed_at < ${cursor}` : sql``;

  const result = await db.execute(sql`
    WITH friend_ids AS (
      SELECT CASE
        WHEN sender_id = ${userId} THEN receiver_id
        ELSE sender_id
      END AS friend_id
      FROM nhp.friend_requests
      WHERE status = 'accepted'
        AND (sender_id = ${userId} OR receiver_id = ${userId})
    )
    SELECT tc.id, tc.user_id, u.display_name, u.search_handle, u.avatar_url,
           tc.task_id, tc.completed_at, tc.data, bdt.task_type, bdt.category
    FROM nhp.task_completions tc
    JOIN nhp.users u ON tc.user_id = u.id
    LEFT JOIN nhp.block_day_tasks bdt ON bdt.id::text = tc.task_id
    WHERE tc.user_id IN (SELECT friend_id FROM friend_ids)
      AND u.privacy_public = true
      ${cursorClause}
    ORDER BY tc.completed_at DESC
    LIMIT ${limit}
  `);

  return (
    result.rows as {
      id: string;
      user_id: number;
      display_name: string | null;
      search_handle: string | null;
      avatar_url: string | null;
      task_id: string;
      completed_at: string;
      data: Record<string, unknown> | null;
      task_type: string | null;
      category: string | null;
    }[]
  ).map((row) => ({
    completionId: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    searchHandle: row.search_handle,
    avatarUrl: row.avatar_url,
    taskId: row.task_id,
    completedAt: row.completed_at,
    completedAtMs: new Date(row.completed_at).getTime(),
    completionData: row.data ?? null,
    dbTaskType: row.task_type ?? null,
    dbCategory: row.category ?? null,
  }));
}

// --- Likes ---

export async function getCompletionDetails(completionId: string): Promise<{
  userId: number;
  taskId: string;
  completionData: Record<string, unknown> | null;
  dbTaskType: string | null;
} | null> {
  const result = await db.execute(sql`
    SELECT tc.user_id, tc.task_id, tc.data, bdt.task_type
    FROM nhp.task_completions tc
    LEFT JOIN nhp.block_day_tasks bdt ON bdt.id::text = tc.task_id
    WHERE tc.id = ${completionId}::uuid
    LIMIT 1
  `);
  const row = (
    result.rows as {
      user_id: number;
      task_id: string;
      data: Record<string, unknown> | null;
      task_type: string | null;
    }[]
  )[0];
  if (!row) return null;
  return {
    userId: row.user_id,
    taskId: row.task_id,
    completionData: row.data ?? null,
    dbTaskType: row.task_type ?? null,
  };
}

const _sportLabels: Record<string, string> = {
  badminton: "Badminton",
  run: "Run",
  pickleball: "Pickleball",
  swimming: "Swimming",
  pilates: "Pilates",
};

export function computeActivityLabel(
  taskId: string,
  completionData: Record<string, unknown> | null,
  dbTaskType: string | null,
): string {
  function sportName(data: Record<string, unknown> | null): string {
    const sportKey = data?.sportKey as string | undefined;
    if (sportKey === "rest") return "Rest";
    if (!sportKey) return "Exercise";
    if (sportKey === "others") return (data?.customSport as string | undefined) ?? "Exercise";
    return _sportLabels[sportKey] ?? "Exercise";
  }
  function dur(data: Record<string, unknown> | null): string {
    const h = (data?.hours as number | undefined) ?? 0;
    const m = (data?.minutes as number | undefined) ?? 0;
    if (h === 0 && m === 0) return "";
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  const registryTask = getRegistryTaskById(taskId);
  if (registryTask) {
    if (registryTask.type === "exercise") {
      const sport = sportName(completionData);
      const d = dur(completionData);
      return d ? `${sport} for ${d}` : sport;
    }
    return getLocalizedString(registryTask.name, "en");
  }
  if (dbTaskType === "exercise") {
    const sport = sportName(completionData);
    const d = dur(completionData);
    return d ? `${sport} for ${d}` : sport;
  }
  return "an activity";
}

export async function toggleLikeInDb(userId: number, completionId: string): Promise<boolean> {
  const existing = await db
    .select({ id: likes.id })
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.completionId, completionId)));

  if (existing.length > 0) {
    await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.completionId, completionId)));
    return false;
  }

  await db.insert(likes).values({ userId, completionId }).onConflictDoNothing();
  return true;
}

export async function getLikeCountsForCompletions(
  completionIds: string[],
): Promise<Record<string, number>> {
  if (completionIds.length === 0) return {};
  const rows = await db
    .select({ completionId: likes.completionId, count: count() })
    .from(likes)
    .where(inArray(likes.completionId, completionIds))
    .groupBy(likes.completionId);
  const result: Record<string, number> = {};
  for (const row of rows) result[row.completionId] = row.count;
  return result;
}

export async function getUserLikedCompletionIds(
  userId: number,
  completionIds: string[],
): Promise<Set<string>> {
  if (completionIds.length === 0) return new Set();
  const rows = await db
    .select({ completionId: likes.completionId })
    .from(likes)
    .where(and(eq(likes.userId, userId), inArray(likes.completionId, completionIds)));
  return new Set(rows.map((r) => r.completionId));
}

export async function getLikersForCompletion(completionId: string): Promise<{
  id: number;
  displayName: string | null;
  searchHandle: string | null;
  avatarUrl: string | null;
}[]> {
  const result = await db.execute(sql`
    SELECT u.id, u.display_name, u.search_handle, u.avatar_url
    FROM nhp.likes l
    JOIN nhp.users u ON u.id = l.user_id
    WHERE l.completion_id = ${completionId}::uuid
    ORDER BY l.created_at DESC
  `);
  return (
    result.rows as {
      id: number;
      display_name: string | null;
      search_handle: string | null;
      avatar_url: string | null;
    }[]
  ).map((r) => ({
    id: r.id,
    displayName: r.display_name,
    searchHandle: r.search_handle,
    avatarUrl: r.avatar_url,
  }));
}

// --- Activity feed (friends' recent completions) ---

export async function getActivityFeed(userId: number) {
  // Fetch completions with user info but without the task JOIN — registry tasks
  // (ULID ids) have no row in block_day_tasks so a direct JOIN drops them.
  const result = await db.execute(sql`
    WITH friend_ids AS (
      SELECT CASE
        WHEN sender_id = ${userId} THEN receiver_id
        ELSE sender_id
      END AS friend_id
      FROM nhp.friend_requests
      WHERE status = 'accepted'
        AND (sender_id = ${userId} OR receiver_id = ${userId})
    )
    SELECT u.display_name, u.search_handle, u.avatar_url, tc.task_id, tc.completed_at
    FROM nhp.task_completions tc
    JOIN nhp.users u ON tc.user_id = u.id
    WHERE (
        tc.user_id = ${userId}
        OR (
          tc.user_id IN (SELECT friend_id FROM friend_ids)
          AND u.privacy_public = true
        )
      )
    ORDER BY tc.completed_at DESC
    LIMIT 50
  `);

  const rows = result.rows as {
    display_name: string | null;
    search_handle: string | null;
    avatar_url: string | null;
    task_id: string;
    completed_at: string;
  }[];

  if (rows.length === 0) return [];

  return rows.flatMap((row) => {
    const task = getRegistryTaskById(row.task_id);
    if (!task) return [];
    return [
      {
        display_name: row.display_name,
        search_handle: row.search_handle,
        avatar_url: row.avatar_url,
        category: task.category,
        activity: getLocalizedString(task.name, "en"),
        completed_at: row.completed_at,
      },
    ];
  });
}
