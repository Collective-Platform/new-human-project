import { db } from "@/src/db";
import { users, tokens } from "@/src/db/shared-schema";
import {
  generateOtp,
  hashToken,
  checkRateLimit,
  sendOtp,
} from "@/src/features/auth";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const body = await request.json();
  const email = body.email?.trim()?.toLowerCase();

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

  // Find or create user
  let userRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userRows.length === 0) {
    await db
      .insert(users)
      .values({ email, role: "user", status: "guest" });
    userRows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
  }

  const userId = userRows[0].id;

  // Generate and store OTP
  const otp = generateOtp();
  const tokenHash = hashToken(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(tokens).values({
    tokenHash,
    userId,
    mode: "otp",
    expiresAt,
  });

  await sendOtp(email, otp);

  return Response.json({ success: true });
}
