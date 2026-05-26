/**
 * Seed script — badge definitions and other DB-managed reference data.
 *
 * Program content (tasks) lives in data/program/ as markdown files and is
 * loaded at runtime by the content registry — not seeded here.
 *
 * Usage: pnpm db:seed
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://localhost:5432/new_human_dev";

const PG_OPTIONS = "-c search_path=nhp,public";

async function seed() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    options: PG_OPTIONS,
  });
  await client.connect();

  try {
    // Block 1 badge definition
    await client.query(
      `INSERT INTO badge_definitions (id, name, description, icon_url, block_number, is_milestone)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [
        "Block 1 Complete",
        "Completed the first 25-day formation block — The Foundation",
        "/icons/badge-block-1.svg",
        1,
        true,
      ],
    );
    await client.query(
      `UPDATE badge_definitions SET icon_url = $1 WHERE block_number = 1 AND icon_url IS NULL`,
      ["/icons/badge-block-1.svg"],
    );
    console.log("  ✅ Seeded Block 1 badge definition");

    console.log("\n🌱 Seeding complete!");
  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
