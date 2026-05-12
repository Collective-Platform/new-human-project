import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/src/db";
import { sql } from "drizzle-orm";

export async function getFriendIds(
  userId: number
): Promise<{ id: number; lastActivityMs: number | null }[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(`friends:${userId}`);

  const result = await db.execute(sql`
    SELECT
      u.id,
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
    ORDER BY u.search_handle, u.display_name
  `);

  return (
    result.rows as { id: number; last_activity: string | null }[]
  ).map((row) => ({
    id: row.id,
    lastActivityMs:
      row.last_activity != null ? new Date(row.last_activity).getTime() : null,
  }));
}

export async function getIncomingRequestIds(
  userId: number
): Promise<{ requestId: string; senderId: number; createdAtMs: number }[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag(`requests:${userId}`);

  const result = await db.execute(sql`
    SELECT fr.id, fr.sender_id, fr.created_at
    FROM nhp.friend_requests fr
    WHERE fr.receiver_id = ${userId}
      AND fr.status = 'pending'
    ORDER BY fr.created_at DESC
  `);

  return (
    result.rows as { id: string; sender_id: number; created_at: string }[]
  ).map((row) => ({
    requestId: row.id,
    senderId: row.sender_id,
    createdAtMs: new Date(row.created_at).getTime(),
  }));
}

export async function getSuggestionIds(
  userId: number
): Promise<{ id: number; mutualCount: number }[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(`suggestions:${userId}`);

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
    SELECT fof.potential_id AS id, COUNT(DISTINCT fof.via_friend_id) AS mutual_count
    FROM friends_of_friends fof
    WHERE fof.potential_id != ${userId}
      AND fof.potential_id NOT IN (SELECT friend_id FROM user_friends)
    GROUP BY fof.potential_id
    HAVING COUNT(DISTINCT fof.via_friend_id) >= 1
    ORDER BY mutual_count DESC, fof.potential_id
    LIMIT 10
  `);

  return (
    result.rows as { id: number; mutual_count: number | string }[]
  ).map((row) => ({
    id: row.id,
    mutualCount: Number(row.mutual_count),
  }));
}

export async function getActivityFeedRows(
  userId: number
): Promise<{ userId: number; taskId: string; completedAtMs: number }[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag(`feed:${userId}`);

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
    SELECT tc.user_id, tc.task_id, tc.completed_at
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

  return (
    result.rows as { user_id: number; task_id: string; completed_at: string }[]
  ).map((row) => ({
    userId: row.user_id,
    taskId: row.task_id,
    completedAtMs: new Date(row.completed_at).getTime(),
  }));
}

export async function getPublicProfile(
  userId: number
): Promise<{
  id: number;
  displayName: string | null;
  searchHandle: string | null;
  avatarUrl: string | null;
} | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(`profile:${userId}`);

  const result = await db.execute(sql`
    SELECT id, display_name, search_handle, avatar_url
    FROM nhp.users
    WHERE id = ${userId}
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
