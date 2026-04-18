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
      from: { email: "noreply@yourdomain.com", name: "The New Human Project" },
      to: [{ email }],
      subject: "Your login code",
      text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send OTP email: ${response.statusText}`);
  }
}
