import { db } from "@/src/db";
import { rateLimitAttempts } from "@/src/db/schema";
import { eq, and, sql } from "drizzle-orm";

export type RateLimitAction = "otp_request" | "otp_verify";

interface RateLimitConfig {
  identifier: string;
  action: RateLimitAction;
  maxAttempts: number;
  windowMinutes: number;
}

export async function checkRateLimit(
  config: RateLimitConfig,
): Promise<{ allowed: boolean; remaining: number }> {
  const { identifier, action, maxAttempts, windowMinutes } = config;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

  // Single atomic upsert — no read-then-write gap that concurrent requests
  // could exploit to bypass the limit.
  const rows = await db
    .insert(rateLimitAttempts)
    .values({
      identifier,
      action,
      attemptCount: 1,
      windowStartedAt: now,
      lastAttemptAt: now,
    })
    .onConflictDoUpdate({
      target: [rateLimitAttempts.identifier, rateLimitAttempts.action],
      set: {
        attemptCount: sql`
          CASE
            WHEN ${rateLimitAttempts.windowStartedAt} <= ${windowStart}
            THEN 1
            ELSE ${rateLimitAttempts.attemptCount} + 1
          END
        `,
        windowStartedAt: sql`
          CASE
            WHEN ${rateLimitAttempts.windowStartedAt} <= ${windowStart}
            THEN ${now}
            ELSE ${rateLimitAttempts.windowStartedAt}
          END
        `,
        lastAttemptAt: now,
      },
    })
    .returning();

  const count = rows[0]?.attemptCount ?? 1;
  const allowed = count <= maxAttempts;
  const remaining = Math.max(0, maxAttempts - count);

  return { allowed, remaining };
}

export async function resetRateLimit(
  identifier: string,
  action: RateLimitAction,
): Promise<void> {
  await db
    .delete(rateLimitAttempts)
    .where(and(eq(rateLimitAttempts.identifier, identifier), eq(rateLimitAttempts.action, action)));
}
