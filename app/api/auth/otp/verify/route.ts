import { db } from "@/src/db";
import { users, tokens } from "@/src/db/shared-schema";
import {
  hashToken,
  checkRateLimit,
  createSession,
  setSessionCookie,
} from "@/src/features/auth";
import { eq, and, gt, isNull } from "drizzle-orm";

export async function POST(request: Request) {
  const body = await request.json();
  const email = body.email?.trim()?.toLowerCase();
  const otp = body.otp?.trim();

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

  // Find user
  const userRows = await db
    .select({ id: users.id, status: users.status })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userRows.length === 0) {
    return Response.json(
      { success: false, error: "Invalid or expired code" },
      { status: 401 }
    );
  }

  const user = userRows[0];
  const otpHash = hashToken(otp);

  // Find matching unused, unexpired token
  const tokenRows = await db
    .select()
    .from(tokens)
    .where(
      and(
        eq(tokens.tokenHash, otpHash),
        eq(tokens.userId, user.id),
        eq(tokens.mode, "otp"),
        gt(tokens.expiresAt, new Date()),
        isNull(tokens.usedAt)
      )
    )
    .limit(1);

  if (tokenRows.length === 0) {
    return Response.json(
      { success: false, error: "Invalid or expired code" },
      { status: 401 }
    );
  }

  // Mark token as used
  await db
    .update(tokens)
    .set({ usedAt: new Date() })
    .where(eq(tokens.id, tokenRows[0].id));

  // Update user: verify email and activate if guest
  const updates: Record<string, unknown> = {};
  updates.emailVerifiedAt = new Date();
  if (user.status === "guest") {
    updates.status = "active";
  }
  await db.update(users).set(updates).where(eq(users.id, user.id));

  // Create session and set cookie
  const cookieValue = await createSession(user.id);
  await setSessionCookie(cookieValue);

  return Response.json({ success: true });
}
