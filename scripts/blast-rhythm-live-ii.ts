/**
 * One-time blast email: RHYTHM LIVE II announcement.
 *
 * Sends to all verified users in the DB via MailerSend's bulk-email endpoint.
 * Batches in groups of 500 (MailerSend's per-request limit).
 *
 * Usage (dry run first!):
 *   pnpm tsx scripts/blast-rhythm-live-ii.ts --dry-run
 *   pnpm tsx scripts/blast-rhythm-live-ii.ts --preview
 *   pnpm tsx scripts/blast-rhythm-live-ii.ts --to=you@example.com
 *   pnpm tsx scripts/blast-rhythm-live-ii.ts
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });

const EVENT_IMAGE_URL = "https://live.rhythm.you/live/rhythm-live-ii-kv.jpg";
const RHYTHM_LOGO_URL = "https://live.rhythm.you/live/rhythm-logo.png";
const REGISTRATION_URL = "https://www.ticket2u.com.my/event/51871_f6ead535ca2b4ceb9801fbb68554b516";
const RHYTHM_LIVE_YELLOW = "#F1A100";

const DRY_RUN = process.argv.includes("--dry-run");
const PREVIEW = process.argv.includes("--preview");
const TEST_TO = process.argv.find((argument) => argument.startsWith("--to="))?.split("=")[1];

const DATABASE_URL = process.env.DATABASE_URL;
const MAILERSEND_KEY = process.env.MAILERSEND_API_KEY;
const FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL ?? "noreply@rhythm.you";
const FROM_NAME = process.env.MAILERSEND_FROM_NAME ?? "Collective";

if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");
if (!MAILERSEND_KEY) throw new Error("MAILERSEND_API_KEY is not set");

function buildEmail(eventImageUrl = EVENT_IMAGE_URL): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Rhythm Live II: The Wind in the Word";

  const text = `THE WIND IN THE WORD: A DEEP DIVE

The Scripture isn't just a book to study, it's a living word breathed by the Holy Spirit.

We're gathering for a deep dive into the relationship between the Spirit and the Word. Learn how the Holy Spirit illuminates truth, cuts through mental noise, and gives you the power to actually live out what you read.

Teaching: Spirit & Scripture Unpacked
Interactive Q&A: Questions & Discussions
Practical Handles: Rhythms for Daily Life

Seats are limited!

9:00AM - 12:00PM
Saturday, 3rd October 2026
Collective Central
RM49 per person

Sign up now: ${REGISTRATION_URL}

Collective`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:32px 16px;background:#ffffff;color:#171717;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td align="center" style="padding-bottom:16px;">
                <img src="${RHYTHM_LOGO_URL}" alt="Rhythm" width="140" style="display:block;width:140px;max-width:100%;height:auto;" />
              </td>
            </tr>
            <tr><td style="border-top:1px solid #e5e5e5;"></td></tr>
            <tr>
              <td style="padding-top:32px;">
                <img src="${eventImageUrl}" alt="Rhythm Live II — October 3, 2026" width="560" style="display:block;width:100%;max-width:560px;height:auto;margin:0 0 32px;" />

                <h1 style="margin:0 0 20px;font-size:28px;line-height:1.15;color:#171717;">The Wind in The Word: A Deep Dive</h1>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                  The Scripture isn&rsquo;t just a book to study, it&rsquo;s a living word breathed by the Holy Spirit.
                </p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#171717;">
                  We&rsquo;re gathering for a deep dive into the relationship between the Spirit and the Word. Learn how the Holy Spirit illuminates truth, cuts through mental noise, and gives you the power to actually live out what you read.
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
                  <tr>
                    <td style="padding:0;">
                      <ul style="margin:0;padding:0;list-style-position:inside;font-size:15px;line-height:1.35;color:#171717;">
                        <li style="margin:0 0 4px;"><strong>Teaching:</strong> Spirit &amp; Scripture Unpacked</li>
                        <li style="margin:0 0 4px;"><strong>Interactive Q&amp;A:</strong> Questions &amp; Discussions</li>
                        <li><strong>Practical Handles:</strong> Rhythms for Daily Life</li>
                      </ul>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 2px;font-size:15px;line-height:1.35;color:#171717;">📅 Saturday, 3rd October 2026</p>
                <p style="margin:0 0 2px;font-size:15px;line-height:1.35;color:#171717;">🕘 9:00AM - 12:00PM</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.35;color:#171717;">📍 Collective Central</p>
                <p style="margin:0 0 2px;font-size:16px;line-height:1.35;font-weight:700;color:#171717;">Seats are limited!</p>
                <p style="margin:0 0 28px;font-size:15px;line-height:1.35;color:#171717;">RM49 per person</p>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 40px;">
                  <tr>
                    <td align="center">
                      <a href="${REGISTRATION_URL}" style="display:inline-block;background:${RHYTHM_LIVE_YELLOW};color:#171717;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:100px;">
                        Get your tickets here
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 48px;font-size:15px;color:#171717;">Collective</p>
              </td>
            </tr>
            <tr><td style="border-top:1px solid #e5e5e5;"></td></tr>
            <tr>
              <td style="padding-top:16px;">
                <p style="margin:0;font-size:11px;line-height:1.6;text-align:center;color:#737373;">
                  You received this email because you&rsquo;re a user of Rhythm.you by Collective.
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
    "SELECT email FROM nhp.users WHERE email_verified_at IS NOT NULL ORDER BY created_at ASC",
  );
  return result.rows.map((row) => row.email);
}

async function sendBatch(emails: string[], subject: string, html: string, text: string) {
  const payload = emails.map((email) => ({
    from: { email: FROM_EMAIL, name: FROM_NAME },
    to: [{ email }],
    subject,
    html,
    text,
  }));

  const response = await fetch("https://api.mailersend.com/v1/bulk-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MAILERSEND_KEY}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`MailerSend error ${response.status}: ${await response.text()}`);
  }

  const result = (await response.json()) as { bulk_email_id?: string };
  console.log(`  ✓ batch queued — bulk_email_id: ${result.bulk_email_id ?? "n/a"}`);
}

async function main() {
  if (DRY_RUN) console.log("🔍 DRY RUN — no emails will be sent\n");

  const previewImageUrl = pathToFileURL(`${process.cwd()}/public/live/rhythm-live-ii-kv.jpg`).href;
  const { subject, html, text } = buildEmail(PREVIEW ? previewImageUrl : EVENT_IMAGE_URL);

  if (PREVIEW) {
    const output = "/tmp/blast-rhythm-live-ii-preview.html";
    writeFileSync(output, html);
    execSync(`open ${output}`);
    console.log(`✅ Preview opened in browser (${output})`);
    return;
  }

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
      console.log("✅ Dry run complete — looks good. Re-run without --dry-run to send.");
      return;
    }

    for (let index = 0; index < emails.length; index += 500) {
      await sendBatch(emails.slice(index, index + 500), subject, html, text);
    }

    console.log("✅ All emails queued.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
