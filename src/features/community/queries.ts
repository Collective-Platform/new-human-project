import { db } from "@/src/db";
import { friendRequests } from "@/src/db/schema";
import { eq, and, sql } from "drizzle-orm";

// --- Friends list (accepted) ---

export async function getFriends(userId: number) {
  const result = await db.execute(sql`
    SELECT
      u.id,
      u.display_name,
      u.avatar_url,
      (
        SELECT tc.completed_at
        FROM nhp.task_completions tc
        WHERE tc.user_id = u.id
        ORDER BY tc.completed_at DESC
        LIMIT 1
      ) AS last_activity
    FROM nhp.friend_requests fr
    JOIN nhp.users u ON u.id = CASE
      WHEN fr.sender_id = ${userId} THEN fr.receiver_id
      ELSE fr.sender_id
    END
    WHERE fr.status = 'accepted'
      AND (fr.sender_id = ${userId} OR fr.receiver_id = ${userId})
    ORDER BY u.display_name
  `);

  return result.rows as {
    id: number;
    display_name: string | null;
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
    if (
      message.includes("unique") ||
      message.includes("duplicate") ||
      message.includes("23505")
    ) {
      return null; // Already exists
    }
    throw err;
  }
}

// --- Accept friend request ---

export async function acceptFriendRequest(
  requestId: string,
  receiverId: number
) {
  const rows = await db
    .update(friendRequests)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(
      and(
        eq(friendRequests.id, requestId),
        eq(friendRequests.receiverId, receiverId),
        eq(friendRequests.status, "pending")
      )
    )
    .returning();
  return rows[0] ?? null;
}

// --- Reject friend request ---

export async function rejectFriendRequest(
  requestId: string,
  receiverId: number
) {
  const rows = await db
    .update(friendRequests)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(
      and(
        eq(friendRequests.id, requestId),
        eq(friendRequests.receiverId, receiverId),
        eq(friendRequests.status, "pending")
      )
    )
    .returning();
  return rows[0] ?? null;
}

// --- Search users by handle or display name ---

export async function searchUsers(query: string, currentUserId: number) {
  const pattern = `%${query}%`;
  const result = await db.execute(sql`
    SELECT id, display_name, avatar_url, search_handle
    FROM nhp.users
    WHERE id != ${currentUserId}
      AND (
        search_handle ILIKE ${pattern}
        OR display_name ILIKE ${pattern}
      )
    ORDER BY display_name
    LIMIT 20
  `);

  return result.rows as {
    id: number;
    display_name: string | null;
    avatar_url: string | null;
    search_handle: string | null;
  }[];
}

// --- People you may know (mutual friends) ---

export async function getPeopleYouMayKnow(userId: number) {
  const result = await db.execute(sql`
    SELECT potential.id, potential.display_name, potential.avatar_url,
           COUNT(*) AS mutual_count
    FROM nhp.users potential
    JOIN nhp.friend_requests fr1 ON (potential.id = fr1.sender_id OR potential.id = fr1.receiver_id)
      AND fr1.status = 'accepted'
    JOIN nhp.friend_requests fr2 ON (fr2.sender_id = ${userId} OR fr2.receiver_id = ${userId})
      AND fr2.status = 'accepted'
    WHERE potential.id != ${userId}
      AND potential.id NOT IN (
        SELECT CASE WHEN sender_id = ${userId} THEN receiver_id ELSE sender_id END
        FROM nhp.friend_requests
        WHERE status = 'accepted'
          AND (sender_id = ${userId} OR receiver_id = ${userId})
      )
    GROUP BY potential.id, potential.display_name, potential.avatar_url
    HAVING COUNT(*) >= 1
    ORDER BY mutual_count DESC
    LIMIT 10
  `);

  return result.rows as {
    id: number;
    display_name: string | null;
    avatar_url: string | null;
    mutual_count: number;
  }[];
}

// --- Activity feed (friends' recent completions) ---

export async function getActivityFeed(userId: number) {
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
    SELECT u.display_name, u.search_handle, u.avatar_url, t.category, t.name AS activity, tc.completed_at
    FROM nhp.task_completions tc
    JOIN nhp.block_day_tasks t ON tc.task_id = t.id
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

  return result.rows as {
    display_name: string | null;
    search_handle: string | null;
    avatar_url: string | null;
    category: string;
    activity: string;
    completed_at: string;
  }[];
}
