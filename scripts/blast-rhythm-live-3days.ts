/**
 * One-time blast email: RHYTHM LIVE — 3 DAYS LEFT reminder
 *
 * Sends to all verified users in the DB via MailerSend bulk-email endpoint.
 * Batches in groups of 500 (MailerSend's per-request limit).
 *
 * Usage (dry run first!):
 *   pnpm tsx scripts/blast-rhythm-live-3days.ts --dry-run
 *   pnpm tsx scripts/blast-rhythm-live-3days.ts --preview
 *   pnpm tsx scripts/blast-rhythm-live-3days.ts --to=you@example.com   # test send
 *   pnpm tsx scripts/blast-rhythm-live-3days.ts                        # real send
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import pg from "pg";
import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

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
  const subject = "⏳ 3 days left to RHYTHM LIVE";

  const text = `We're only 3 days away from RHYTHM LIVE.

This Saturday, July 4 (10am-3pm), we're gathering as a community to step out of the app and into the physical, to explore how the pursuit of our mental, emotional and physical health is integral to our spiritual formation.

This is not just another event.

It's a full-day activation of what we've been practicing but physically and together with others who are on the same journey.

We've also got specially curated activation sessions before and after the event designed to get you moving:

• Hyrox
• Spin
• Breathwork & Ice Plunge
• Run (Sold out)
• Pilates (Sold out)
• Emotional Cadence (Sold out)
• Mental Framing (Sold out)

These are small group activations, and once they're full, they're gone.

For Rhythm Live participants, these activations are just: RM20 per session

This is our way of making sure you get the most out of this weekend possible.

⏳ 3 days left - don't wait

If you've been thinking about joining or trying the activations, this is your moment.

Once the slots are filled, we won't be adding more.

👉 Secure your spot now

Register for Rhythm Live + book your activations here:
=> ${REGISTRATION_URL}
Activations: ${TRACKS_URL}

We're excited to see you in the room.

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
                We're only <strong>3 days away</strong> from RHYTHM LIVE.
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                This <strong>Saturday, July 4 (10am-3pm)</strong>, we're gathering as a community to step out of the app and into the physical, to explore how the pursuit of our mental, emotional and physical health is integral to our spiritual formation.
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                This is not just another event.
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                It's a full-day activation of what we've been practicing but <strong>physically</strong> and <strong>together</strong> with others who are on the same journey.
              </p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#171717;">
                We've also got specially curated activation sessions before and after the event designed to get you moving:
              </p>
              <ul style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.9;color:#171717;">
                <li>Hyrox</li>
                <li>Spin</li>
                <li>Breathwork &amp; Ice Plunge</li>
                <li>Run <span style="color:#be2b17;">(Sold out)</span></li>
                <li>Pilates <span style="color:#be2b17;">(Sold out)</span></li>
                <li>Emotional Cadence <span style="color:#be2b17;">(Sold out)</span></li>
                <li>Mental Framing <span style="color:#be2b17;">(Sold out)</span></li>
              </ul>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                These are <strong>small group activations</strong>, and once they're full, they're gone.
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                For Rhythm Live participants, these activations are just: <strong>RM20</strong> per session
              </p>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#171717;">
                This is our way of making sure you get the most out of this weekend possible.
              </p>

              <p style="margin:0 0 12px;font-size:16px;line-height:1.7;font-weight:700;color:#be2b17;">
                ⏳ 3 days left - don't wait
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#171717;">
                If you've been thinking about joining or trying the activations, this is your moment.
              </p>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#171717;">
                Once the slots are filled, we won't be adding more.
              </p>

              <p style="margin:0 0 12px;font-size:15px;line-height:1.7;font-weight:700;color:#171717;">
                👉 Secure your spot now
              </p>
              <p style="margin:0 0 40px;font-size:15px;line-height:1.7;color:#171717;">
                Register for <a href="${REGISTRATION_URL}" style="color:#be2b17;text-decoration:underline;">Rhythm Live</a> + book your <a href="${TRACKS_URL}" style="color:#be2b17;text-decoration:underline;">activations</a> here:<br /><br />
                =&gt; <a href="${REGISTRATION_URL}" style="color:#be2b17;text-decoration:underline;">${REGISTRATION_URL}</a>
              </p>

              <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#171717;">
                We're excited to see you in the room.
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
    const out = "/tmp/blast-rhythm-live-3days-preview.html";
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
