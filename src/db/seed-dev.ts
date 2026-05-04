/**
 * Development seed script
 *
 * Inserts test users and sessions so you can log in locally
 * without needing MailerSend or real OTP flow.
 *
 * Usage: pnpm db:seed-dev
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { randomBytes, createHmac } from "node:crypto";
import pg from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/new_human_dev";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";

function generateSessionId(): string {
  // 21-char nanoid-style ID matching giving-platform session IDs
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  const bytes = randomBytes(21);
  let id = "";
  for (let i = 0; i < 21; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}

function hashToken(rawToken: string): string {
  return createHmac("sha256", SESSION_SECRET).update(rawToken).digest("hex");
}

async function seed() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    options: "-c search_path=nhp,public",
  });
  await client.connect();

  try {
    console.log("🌱 Seeding development database...\n");

    // Insert test users. nhp.users has a unique index on lower(email), so the
    // ON CONFLICT target is the expression, not a plain column.
    const userResult = await client.query(
      `INSERT INTO users (email, email_verified_at, display_name, role, status)
       VALUES ($1, now(), $2, $3, $4)
       ON CONFLICT (lower(email)) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         role = EXCLUDED.role,
         status = EXCLUDED.status
       RETURNING id, email, role`,
      ["user@test.local", "Test User", "user", "active"],
    );

    const adminResult = await client.query(
      `INSERT INTO users (email, email_verified_at, display_name, role, status)
       VALUES ($1, now(), $2, $3, $4)
       ON CONFLICT (lower(email)) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         role = EXCLUDED.role,
         status = EXCLUDED.status
       RETURNING id, email, role`,
      ["admin@test.local", "Test Admin", "admin", "active"],
    );

    const testUser = userResult.rows[0];
    const adminUser = adminResult.rows[0];

    console.log(
      `  ✅ User:  id=${testUser.id}  ${testUser.email}  (${testUser.role})`,
    );
    console.log(
      `  ✅ Admin: id=${adminUser.id}  ${adminUser.email}  (${adminUser.role})`,
    );

    // Create sessions for both users
    const sessions: { email: string; cookie: string }[] = [];

    for (const user of [testUser, adminUser]) {
      const sessionId = generateSessionId();
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await client.query(
        `INSERT INTO sessions (id, token_hash, user_id, expires_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [sessionId, tokenHash, user.id, expiresAt],
      );

      const cookie = `${sessionId}.${rawToken}`;
      sessions.push({ email: user.email, cookie });
    }

    console.log("\n  📋 Session cookies (set as __session in browser):\n");
    for (const s of sessions) {
      console.log(`  ${s.email}:`);
      console.log(`    ${s.cookie}\n`);
    }

    console.log("🌱 Seeding complete!");
  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
