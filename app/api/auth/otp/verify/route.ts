import { db } from "@/src/db";
import { users, pendingAuth } from "@/src/db/schema";
import {
  hashToken,
  checkRateLimit,
  createSession,
  setSessionCookie,
} from "@/src/features/auth";
import { and, eq, gt, isNull, sql } from "drizzle-orm";

type Mode = "login" | "signup";

export async function POST(request: Request) {
  const body = await request.json();
  const email = body.email?.trim()?.toLowerCase();
  const otp = body.otp?.trim();
  const mode: Mode = body.mode === "signup" ? "signup" : "login";

  if (!email || !otp) {
    return Response.json(
      { success: false, error: "Email and OTP are required" },
      { status: 400 }
    );
  }

  const { allowed } = await checkRateLimit({
    identifier: email,
    action: "otp_verify",
    maxAttempts: 10,
    windowMinutes: 5,
  });

  if (!allowed) {
    return Response.json(
      { success: false, error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const otpHash = hashToken(otp);

  // Look up an unconsumed, unexpired pending_auth row matching the
  // (email, mode, hash) tuple. The same hash being used for the wrong mode
  // (signup OTP submitted on login form, or vice versa) is rejected.
  const pendingRows = await db
    .select()
    .from(pendingAuth)
    .where(
      and(
        eq(pendingAuth.tokenHash, otpHash),
        sql`lower(${pendingAuth.email}) = ${email}`,
        eq(pendingAuth.mode, mode),
        gt(pendingAuth.expiresAt, new Date()),
        isNull(pendingAuth.consumedAt)
      )
    )
    .limit(1);

  if (pendingRows.length === 0) {
    return Response.json(
      { success: false, error: "Invalid or expired code" },
      { status: 401 }
    );
  }

  const pending = pendingRows[0];

  // Mark consumed first so a successful verify can't be replayed.
  await db
    .update(pendingAuth)
    .set({ consumedAt: new Date() })
    .where(eq(pendingAuth.id, pending.id));

  // Resolve / create the user row. This is the FIRST time we touch
  // `users` — typo'd emails never reach this branch because they can't
  // produce a valid OTP.
  let userId: number;

  if (mode === "signup") {
    // Look up first; if a row already exists (e.g., race, or guest row
    // pre-created some other way) promote it. Otherwise INSERT.
    // The unique index on lower(email) is the ultimate guard against races.
    const existing = await db
      .select({ id: users.id, status: users.status })
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);

    if (existing.length > 0) {
      userId = existing[0].id;
      await db
        .update(users)
        .set({
          status: "active",
          emailVerifiedAt: sql`COALESCE(${users.emailVerifiedAt}, ${new Date()})`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } else {
      const inserted = await db
        .insert(users)
        .values({
          email,
          status: "active",
          emailVerifiedAt: new Date(),
        })
        .returning();
      userId = inserted[0].id;
    }
  } else {
    // mode === "login": user must exist. Stamp email_verified_at if it
    // wasn't already set (idempotent NULL → now()).
    const found = await db
      .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);

    if (found.length === 0) {
      return Response.json(
        { success: false, error: "Invalid or expired code" },
        { status: 401 }
      );
    }

    userId = found[0].id;

    if (!found[0].emailVerifiedAt) {
      await db
        .update(users)
        .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(users.id, userId), isNull(users.emailVerifiedAt)));
    }
  }

  const cookieValue = await createSession(userId);
  await setSessionCookie(cookieValue);

  return Response.json({ success: true });
}
