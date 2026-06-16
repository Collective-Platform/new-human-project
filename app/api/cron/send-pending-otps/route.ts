import { db } from "@/src/db";
import { pendingAuth } from "@/src/db/schema";
import { buildOtpEmail } from "@/src/features/auth/send-otp";
import { env } from "@/src/env";
import { and, gt, inArray, isNotNull, isNull } from "drizzle-orm";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pending = await db
      .select({
        id: pendingAuth.id,
        email: pendingAuth.email,
        otpPlaintext: pendingAuth.otpPlaintext,
      })
      .from(pendingAuth)
      .where(
        and(
          isNull(pendingAuth.emailSentAt),
          isNotNull(pendingAuth.otpPlaintext),
          isNull(pendingAuth.consumedAt),
          gt(pendingAuth.expiresAt, new Date()),
        ),
      );

    if (pending.length === 0) {
      return Response.json({ sent: 0 });
    }

    const messages = pending.map(({ email, otpPlaintext }) => {
      const { html, text } = buildOtpEmail(otpPlaintext!, env.MAILERSEND_FROM_NAME);
      return {
        from: { email: env.MAILERSEND_FROM_EMAIL, name: env.MAILERSEND_FROM_NAME },
        to: [{ email }],
        subject: "Your login code",
        html,
        text,
      };
    });

    const res = await fetch("https://api.mailersend.com/v1/bulk-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.MAILERSEND_API_KEY}`,
      },
      body: JSON.stringify(messages),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json().catch(() => ({}));
    console.log(
      `[cron] bulk-email status=${res.status} bulk_email_id=${data.bulk_email_id} count=${pending.length}`,
    );

    if (res.ok || res.status === 202) {
      const ids = pending.map((r) => r.id);
      await db
        .update(pendingAuth)
        .set({ emailSentAt: new Date(), otpPlaintext: null })
        .where(inArray(pendingAuth.id, ids));
    }

    return Response.json({ sent: pending.length, bulk_email_id: data.bulk_email_id });
  } catch (err) {
    console.error("[cron] send-pending-otps failed:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
