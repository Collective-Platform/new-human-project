/**
 * One-time blast email: 25-DAY BLOCK FEEDBACK request
 *
 * Sends to all verified users in the DB via MailerSend bulk-email endpoint.
 * Batches in groups of 500 (MailerSend's per-request limit).
 *
 * Usage (dry run first!):
 *   pnpm tsx scripts/blast-feedback.ts --dry-run
 *   pnpm tsx scripts/blast-feedback.ts --preview
 *   pnpm tsx scripts/blast-feedback.ts --to=you@example.com   # test send
 *   pnpm tsx scripts/blast-feedback.ts                        # real send
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import pg from "pg";
import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const FEEDBACK_FORM_URL = "https://forms.gle/5Grm6enVuZXJdvQU9";

const DRY_RUN = process.argv.includes("--dry-run");
const PREVIEW = process.argv.includes("--preview");
const TEST_TO = process.argv.find((a) => a.startsWith("--to="))?.split("=")[1];

const DATABASE_URL = process.env.DATABASE_URL!;
const MAILERSEND_KEY = process.env.MAILERSEND_API_KEY!;
const FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL ?? "noreply@rhythm.you";
const FROM_NAME = process.env.MAILERSEND_FROM_NAME ?? "Collective";

if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");
if (!MAILERSEND_KEY) throw new Error("MAILERSEND_API_KEY is not set");

function buildEmail(): { subject: string; html: string; text: string } {
  const subject =
    "You finished your first 25-day Rhythm block - tell us how it went 🎉";

  const text = `Congratulations on completing your first 25-day Rhythm block! 🎉

Twenty-five days of showing up for yourself is no small achievement, and we hope this journey has helped you build a rhythm for your mental, emotional, and physical well-being.

As we continue improving Rhythm, we'd love to hear about your experience.

Whether you've noticed a small shift in your daily habits or a significant change in your life, your story matters. Your feedback helps us understand what's working, what can be improved, and how we can better serve more users.

If you have 2-3 minutes, we'd really appreciate it if you could share:
• What changes have you noticed after completing the 25 days?
• Which part of Rhythm impacted you the most?
• Is there anything you wish was better or easier to use?

Share your feedback here:
${FEEDBACK_FORM_URL}

If there's a particular story or breakthrough you're comfortable sharing, we'd especially love to hear it. With your permission, we may feature anonymous excerpts to encourage others beginning their own Rhythm journey.

Thank you for trusting us to be part of these past 25 days.

We're excited to keep growing with you.

Collective`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:32px 16px;font-family:sans-serif;background:#ffffff;color:#171717;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0" role="presentation">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <span style="font-family:sans-serif;font-size:24px;font-weight:700;color:#be2b17;">Rhythm</span>
            </td>
          </tr>
          <tr><td style="border-top:1px solid #e5e5e5;"></td></tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 0 0;">

              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                Congratulations on completing your first <strong>25-day Rhythm block</strong>! 🎉
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                Twenty-five days of showing up for yourself is no small achievement, and we hope this journey has helped you build a rhythm for your mental, emotional, and physical well-being.
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                As we continue improving Rhythm, we'd love to hear about your experience.
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                Whether you've noticed a small shift in your daily habits or a significant change in your life, your story matters. Your feedback helps us understand what's working, what can be improved, and how we can better serve more users.
              </p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#171717;">
                If you have 2-3 minutes, we'd really appreciate it if you could share:
              </p>
              <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.9;color:#171717;">
                <li>What changes have you noticed after completing the 25 days?</li>
                <li>Which part of Rhythm impacted you the most?</li>
                <li>Is there anything you wish was better or easier to use?</li>
              </ul>

              <!-- CTA: Share feedback -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 32px;">
                <tr>
                  <td align="center">
                    <a href="${FEEDBACK_FORM_URL}" style="display:inline-block;background:#be2b17;color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:100px;">
                      Share your feedback
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                If there's a particular story or breakthrough you're comfortable sharing, we'd especially love to hear it. With your permission, we may feature anonymous excerpts to encourage others beginning their own Rhythm journey.
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                Thank you for trusting us to be part of these past 25 days.
              </p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#171717;">
                We're excited to keep growing with you.
              </p>
              <p style="margin:0 0 48px;font-size:15px;font-weight:700;color:#171717;">Collective</p>

            </td>
          </tr>

          <!-- Footer -->
          <tr><td style="border-top:1px solid #e5e5e5;"></td></tr>
          <tr>
            <td style="padding-top:16px;">
              <p style="margin:0;font-size:11px;line-height:1.6;text-align:center;color:#737373;">
                You received this email because you're a user of Rhythm.you by Collective.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

async function fetchAllEmails(client: pg.Client): Promise<string[]> {
  const result = await client.query<{ email: string }>(
    `SELECT email FROM nhp.users WHERE email_verified_at IS NOT NULL ORDER BY created_at ASC`,
  );
  return result.rows.map((r) => r.email);
}

async function sendBatch(
  emails: string[],
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  const payload = emails.map((email) => ({
    from: { email: FROM_EMAIL, name: FROM_NAME },
    to: [{ email }],
    subject,
    html,
    text,
  }));

  const res = await fetch("https://api.mailersend.com/v1/bulk-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MAILERSEND_KEY}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MailerSend error ${res.status}: ${body}`);
  }

  const json = (await res.json()) as { bulk_email_id?: string };
  console.log(
    `  ✓ batch queued — bulk_email_id: ${json.bulk_email_id ?? "n/a"}`,
  );
}

async function main() {
  if (DRY_RUN) console.log("🔍 DRY RUN — no emails will be sent\n");

  const { subject, html, text } = buildEmail();

  if (PREVIEW) {
    const out = "/tmp/blast-feedback-preview.html";
    writeFileSync(out, html);
    execSync(`open ${out}`);
    console.log(`✅ Preview opened in browser (${out})`);
    return;
  }

  // Test send to a single address
  if (TEST_TO) {
    console.log(`📧 Test send to: ${TEST_TO}`);
    await sendBatch([TEST_TO], subject, html, text);
    console.log("✅ Test email sent.");
    return;
  }

  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    const emails = await fetchAllEmails(client);
    console.log(`Found ${emails.length} verified users.`);

    if (DRY_RUN) {
      console.log("First 5:", emails.slice(0, 5));
      console.log("\nEmail subject:", subject);
      console.log(
        "✅ Dry run complete — looks good. Re-run without --dry-run to send.",
      );
      return;
    }

    const BATCH_SIZE = 500;

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      console.log(
        `Sending batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} emails)…`,
      );
      await sendBatch(batch, subject, html, text);
      if (i + BATCH_SIZE < emails.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    console.log(`\n✅ Done — ${emails.length} emails queued.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
