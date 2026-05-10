import { db } from "@/src/db";
import { sql } from "drizzle-orm";

export async function getFriendIdsRaw(userId: number): Promise<number[]> {
  const result = await db.execute(sql`
    SELECT CASE
      WHEN sender_id = ${userId} THEN receiver_id
      ELSE sender_id
    END AS friend_id
    FROM nhp.friend_requests
    WHERE status = 'accepted'
      AND (sender_id = ${userId} OR receiver_id = ${userId})
  `);

  return (result.rows as { friend_id: number }[]).map((r) => r.friend_id);
}
