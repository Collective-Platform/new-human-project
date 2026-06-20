/**
 * One-time blast email: RHYTHM LIVE announcement
 *
 * Sends to all verified users in the DB via MailerSend bulk-email endpoint.
 * Batches in groups of 500 (MailerSend's per-request limit).
 *
 * Usage (dry run first!):
 *   pnpm tsx scripts/blast-rhythm-live.ts --dry-run
 *   pnpm tsx scripts/blast-rhythm-live.ts
 *
 * TODO before running:
 *   1. Replace FLYER_RHYTHM_LIVE_URL with a public image URL (upload to Vercel/S3/Cloudinary)
 *   2. Replace FLYER_SPEAKERS_URL with a public image URL
 *   3. Replace REGISTRATION_URL with the actual registration link
 *   4. Replace TRACKS_URL with the actual activation class booking link
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import pg from "pg";
import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const FLYER_RHYTHM_LIVE_URL =
  "https://live.rhythm.you/live/rhythm-live-flyer.jpg";
const FLYER_SPEAKERS_URL =
  "https://live.rhythm.you/live/rhythm-live-voices-flyer.jpg";
const REGISTRATION_URL = "https://live.rhythm.you/";
const TRACKS_URL = "https://live.rhythm.you/#tracks";

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
  const subject = "You're invited to Rhythm Live!";

  const text = `Congratulations for committing yourself to build a healthy physical, emotional and mental rhythm in your life!

Keep going until you reach the end of the first 25-day block inside RHYTHM.YOU! You can do it!

If you haven't heard, we're gathering everyone for a RHYTHM LIVE physical event on Saturday, July 4, 10am–3pm.

In this one-day event, we are going to explore and activate how RHYTHM works in practice in a community. On top of that, we are bringing expert coaches, teachers, motivators LIVE on stage to elevate our physical, emotional and mental capacity.

If you haven't yet registered for the event, click on the link below.

Register here: ${REGISTRATION_URL}

For more fun and adventure, we have LIVE activation sessions before and after the event for these specially curated classes:
• Hyrox
• Spin
• Run
• Pilates
• Breathwork and cold plunge
• Mental Framing with Dan Blythe

Ready to have fun with others in the community? Slots are limited. It's first come first serve.

Book your activation class here: ${TRACKS_URL}

We are so excited to have you on this journey!

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
                Congratulations for committing yourself to build a healthy physical, emotional and mental rhythm in your life!
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                Keep going until you reach the end of the first 25-day block inside RHYTHM.YOU! You can do it!
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                If you haven't heard, we're gathering everyone for a <strong>RHYTHM LIVE</strong> physical event on <strong>Saturday, July 4, 10am–3pm</strong>.
              </p>

              <!-- Flyer 1 -->
              <img src="${FLYER_RHYTHM_LIVE_URL}" alt="RHYTHM LIVE" width="560" style="display:block;width:100%;max-width:560px;margin:0 0 16px;" />

              <!-- Flyer 2 -->
              <img src="${FLYER_SPEAKERS_URL}" alt="Speakers" width="560" style="display:block;width:100%;max-width:560px;margin:0 0 28px;" />

              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                In this one-day event, we are going to explore and activate how RHYTHM works in practice in a community. On top of that, we are bringing expert coaches, teachers, motivators LIVE on stage to elevate our physical, emotional and mental capacity.
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                If you haven't yet registered for the event, click on the link below.
              </p>

              <!-- CTA: Register -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 32px;">
                <tr>
                  <td align="center">
                    <a href="${REGISTRATION_URL}" style="display:inline-block;background:#be2b17;color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:100px;">
                      Register here
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#171717;">
                For more fun and adventure, we have LIVE activation sessions before and after the event for these specially curated classes:
              </p>
              <ul style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.9;color:#171717;">
                <li>Hyrox</li>
                <li>Spin</li>
                <li>Run</li>
                <li>Pilates</li>
                <li>Breathwork and cold plunge</li>
                <li>Mental Framing with Dan Blythe</li>
              </ul>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                Ready to have fun with others in the community? Slots are limited. It's first come first serve.
              </p>

              <!-- CTA: Book tracks -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 40px;">
                <tr>
                  <td align="center">
                    <a href="${TRACKS_URL}" style="display:inline-block;background:#171717;color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:100px;">
                      Book your activation class
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#171717;">
                We are so excited to have you on this journey!
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
    const out = "/tmp/blast-preview.html";
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
