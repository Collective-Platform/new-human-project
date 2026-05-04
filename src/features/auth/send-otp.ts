import { env } from "@/src/env";

export async function sendOtp(email: string, otp: string): Promise<void> {
  if (!env.MAILERSEND_API_KEY) {
    console.log(`\n📧 OTP for ${email}: ${otp}\n`);
    return;
  }

  const response = await fetch("https://api.mailersend.com/v1/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.MAILERSEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: { email: env.MAILERSEND_FROM_EMAIL, name: env.MAILERSEND_FROM_NAME },
      to: [{ email }],
      subject: "Your login code",
      text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to send OTP email: ${response.status} ${response.statusText} — ${body}`
    );
  }
}
