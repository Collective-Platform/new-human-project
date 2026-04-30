import { db } from "@/src/db";
import { rateLimitAttempts } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

export type RateLimitAction = "otp_request" | "otp_verify";

interface RateLimitConfig {
  identifier: string;
  action: RateLimitAction;
  maxAttempts: number;
  windowMinutes: number;
}

export async function checkRateLimit(
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number }> {
  const { identifier, action, maxAttempts, windowMinutes } = config;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

  const existing = await db
    .select()
    .from(rateLimitAttempts)
    .where(
      and(
        eq(rateLimitAttempts.identifier, identifier),
        eq(rateLimitAttempts.action, action)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(rateLimitAttempts).values({
      identifier,
      action,
      attemptCount: 1,
      windowStartedAt: now,
      lastAttemptAt: now,
    });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  const record = existing[0];

  if (record.windowStartedAt < windowStart) {
    await db
      .update(rateLimitAttempts)
      .set({ attemptCount: 1, windowStartedAt: now, lastAttemptAt: now })
      .where(
        and(
          eq(rateLimitAttempts.identifier, identifier),
          eq(rateLimitAttempts.action, action)
        )
      );
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (record.attemptCount >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  await db
    .update(rateLimitAttempts)
    .set({
      attemptCount: record.attemptCount + 1,
      lastAttemptAt: now,
    })
    .where(
      and(
        eq(rateLimitAttempts.identifier, identifier),
        eq(rateLimitAttempts.action, action)
      )
    );

  return { allowed: true, remaining: maxAttempts - record.attemptCount - 1 };
}
