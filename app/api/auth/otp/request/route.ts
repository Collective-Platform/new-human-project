import { db } from "@/src/db";
import { users, tokens } from "@/src/db/shared-schema";
import {
  generateOtp,
  hashToken,
  checkRateLimit,
  sendOtp,
} from "@/src/features/auth";
import { eq } from "drizzle-orm";

type Mode = "login" | "signup";

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

  const userRows = await db
    .select({ id: users.id, status: users.status })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId: number;

  if (mode === "login") {
    // Login requires an existing, active user
    if (userRows.length === 0 || userRows[0].status !== "active") {
      return Response.json(
        {
          success: false,
          code: "NOT_EXISTS",
          error: "No account found for this email. Please sign up instead.",
        },
        { status: 404 }
      );
    }
    userId = userRows[0].id;
  } else {
    // Signup: create user if missing; reject if already active
    if (userRows.length === 0) {
      await db
        .insert(users)
        .values({ email, role: "user", status: "guest" });
      const created = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      userId = created[0].id;
    } else {
      if (userRows[0].status === "active") {
        return Response.json(
          {
            success: false,
            code: "ALREADY_EXISTS",
            error: "An account with this email already exists. Please log in instead.",
          },
          { status: 409 }
        );
      }
      userId = userRows[0].id;
    }
  }

  // Generate and store OTP, stamped with the intent (mode)
  const otp = generateOtp();
  const tokenHash = hashToken(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(tokens).values({
    tokenHash,
    userId,
    mode,
    expiresAt,
  });

  await sendOtp(email, otp);

  return Response.json({ success: true });
}
