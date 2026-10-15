/**
 * One-time backfill for nhp.member_block_attempts.
 *
 * Blocks used to advance by date alone (25 days after the previous block started,
 * not before the block's launch date). Block position is now stored. This script
 * runs the OLD date logic once per onboarded user and writes an attempt row for
 * every block 1..active, so nobody moves. Blocks before the active one are closed
 * (`completed_at` = old block end); the active block stays open.
 *
 * Users still in block 1 get no rows (block 1 is derived from `onboarded_at`).
 * Safe to run more than once — existing rows are left alone.
 *
 * Run in the same release step as the migration, or users in blocks 2+ fall back
 * to block 1.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-block-attempts.ts [--dry-run]
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://localhost:5432/new_human_dev";
const PG_OPTIONS = "-c search_path=nhp,public";
const DRY_RUN = process.argv.includes("--dry-run");
const DAY_MS = 86_400_000;

async function main() {
  // Imported after dotenv so src/env.ts sees the variables.
  const {
    BLOCK_LAUNCH,
    BLOCK_LENGTH_DAYS,
    PROGRAM_DEFAULT_TZ,
    getEffectiveStart,
    getLocalDateMarker,
  } = await import("../src/lib/program-gate");

  const tz = PROGRAM_DEFAULT_TZ;
  const today = Math.round(getLocalDateMarker(new Date(), tz).getTime() / DAY_MS);

  // Old chaining: block N starts at max(previous start + 25 days, its launch date).
  function oldBlockStart(onboardedAt: Date, n: number): Date {
    if (n <= 1) return getEffectiveStart(onboardedAt, tz);
    const earliest = oldBlockStart(onboardedAt, n - 1).getTime() + BLOCK_LENGTH_DAYS * DAY_MS;
    const launch = BLOCK_LAUNCH[n];
    return new Date(launch && launch.getTime() > earliest ? launch.getTime() : earliest);
  }

  const client = new pg.Client({ connectionString: DATABASE_URL, options: PG_OPTIONS });
  await client.connect();

  const { rows: users } = await client.query<{ id: number; onboarded_at: Date }>(
    "SELECT id, onboarded_at FROM nhp.users WHERE onboarded_at IS NOT NULL",
  );

  let usersTouched = 0;
  let rowsInserted = 0;

  for (const user of users) {
    const onboardedAt = new Date(user.onboarded_at);
    let active = 1;
    while (Math.round(oldBlockStart(onboardedAt, active + 1).getTime() / DAY_MS) <= today) {
      active++;
    }
    if (active === 1) continue;
    usersTouched++;

    for (let n = 1; n <= active; n++) {
      const start = oldBlockStart(onboardedAt, n);
      const completedAt =
        n < active ? new Date(start.getTime() + BLOCK_LENGTH_DAYS * DAY_MS) : null;
      console.log(
        `user ${user.id}: block ${n} starts ${start.toISOString().slice(0, 10)}` +
          (completedAt ? `, completed ${completedAt.toISOString().slice(0, 10)}` : " (active)"),
      );
      if (DRY_RUN) continue;
      const res = await client.query(
        `INSERT INTO nhp.member_block_attempts (user_id, block_number, attempt, starts_on, completed_at)
         VALUES ($1, $2, 1, $3, $4)
         ON CONFLICT (user_id, block_number, attempt) DO NOTHING`,
        [user.id, n, start.toISOString().slice(0, 10), completedAt],
      );
      rowsInserted += res.rowCount ?? 0;
    }
  }

  await client.end();
  console.log(
    `${DRY_RUN ? "[dry run] " : ""}${usersTouched} users past block 1, ${rowsInserted} rows inserted`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
