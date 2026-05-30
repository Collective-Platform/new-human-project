import { env } from "@/src/env";

export class MailerSendRateLimitError extends Error {
  constructor() {
    super("MailerSend rate limit reached");
    this.name = "MailerSendRateLimitError";
  }
}

export function buildOtpEmail(
  otp: string,
  fromName: string,
): { html: string; text: string } {
  const text = `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nYou've received this email as part of the log in process. This is a mandatory service email from ${fromName}.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your login code</title>
</head>
<body style="margin:0;padding:32px 16px;font-family:sans-serif;background:#ffffff;color:#171717;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0" role="presentation">

          <!-- Header: org name -->
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <span style="font-family:sans-serif;font-size:18px;font-weight:700;color:#be2b17;">${fromName}</span>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-top:1px solid #e5e5e5;padding:0;"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:60px 0 88px;">
              <p style="margin:0 0 32px;font-size:30px;font-weight:600;text-align:center;color:#171717;">Hi there &#x1F44B;,</p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.6;text-align:center;color:#171717;">We have received a login attempt. Here&rsquo;s the verification code you&rsquo;ll need to log in. This code is only valid for 10 minutes.</p>
              <div style="background:#f3f4f4;padding:16px;text-align:center;">
                <span style="font-family:sans-serif;font-size:30px;font-weight:400;letter-spacing:0.2em;color:#be2b17;">${otp}</span>
              </div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-top:1px solid #e5e5e5;padding:0;"></td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;">
              <p style="margin:0;font-size:11px;line-height:1.6;text-align:center;color:#737373;">You&rsquo;ve received this email as part of the log in process. This is a mandatory service email from ${fromName}.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text };
}

export async function sendOtp(email: string, otp: string): Promise<void> {
  if (!env.MAILERSEND_API_KEY) {
    console.log(`\n📧 OTP for ${email}: ${otp}\n`);
    return;
  }

  const { html, text } = buildOtpEmail(otp, env.MAILERSEND_FROM_NAME);

  const response = await fetch("https://api.mailersend.com/v1/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.MAILERSEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: {
        email: env.MAILERSEND_FROM_EMAIL,
        name: env.MAILERSEND_FROM_NAME,
      },
      to: [{ email }],
      subject: "Your login code",
      html,
      text,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 429) throw new MailerSendRateLimitError();
    throw new Error(
      `Failed to send OTP email: ${response.status} ${response.statusText} — ${body}`,
    );
  }
}
