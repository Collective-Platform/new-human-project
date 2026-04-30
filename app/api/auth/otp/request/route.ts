import { db } from "@/src/db";
import { users, pendingAuth } from "@/src/db/schema";
import {
  generateOtp,
  hashToken,
  checkRateLimit,
  sendOtp,
} from "@/src/features/auth";
import { and, eq, gt, isNull, sql } from "drizzle-orm";

type Mode = "login" | "signup";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(request: Request) {
  const body = await request.json();
  const email = body.email?.trim()?.toLowerCase();
  const mode: Mode = body.mode === "signup" ? "signup" : "login";

  if (!email) {
    return Response.json(
      { success: false, error: "Email is required" },
      { status: 400 }
    );
  }

  const { allowed } = await checkRateLimit({
    identifier: email,
    action: "otp_request",
    maxAttempts: 5,
    windowMinutes: 15,
  });

  if (!allowed) {
    return Response.json(
      { success: false, error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  // Check whether a user with this email already exists. We DO NOT create a
  // users row here — that only happens after the OTP is verified, so a typo
  // can't pollute `users`.
  const userRows = await db
    .select({ id: users.id, status: users.status })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  const existing = userRows[0];

  if (mode === "login") {
    if (!existing || existing.status !== "active") {
      return Response.json(
        {
          success: false,
          code: "NOT_EXISTS",
          error: "No account found for this email. Please sign up instead.",
        },
        { status: 404 }
      );
    }
  } else {
    // signup
    if (existing && existing.status === "active") {
      return Response.json(
        {
          success: false,
          code: "ALREADY_EXISTS",
          error:
            "An account with this email already exists. Please log in instead.",
        },
        { status: 409 }
      );
    }
  }

  // Invalidate any prior unconsumed OTPs for this email + mode so an old code
  // can't be used against a new request.
  await db
    .update(pendingAuth)
    .set({ consumedAt: new Date() })
    .where(
      and(
        sql`lower(${pendingAuth.email}) = ${email}`,
        eq(pendingAuth.mode, mode),
        isNull(pendingAuth.consumedAt),
        gt(pendingAuth.expiresAt, new Date())
      )
    );

  const otp = generateOtp();
  const tokenHash = hashToken(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await db.insert(pendingAuth).values({
    email,
    tokenHash,
    mode,
    expiresAt,
  });

  await sendOtp(email, otp);

  return Response.json({ success: true });
}
