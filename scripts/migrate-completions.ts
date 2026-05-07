/**
 * Backfill task_completions: swap legacy UUID task_ids for the new ULID
 * task_ids that come from the markdown program registry.
 *
 * Safe to run multiple times — rows already using a ULID are skipped.
 *
 * Usage:
 *   pnpm tsx scripts/migrate-completions.ts [--dry-run]
 *
 * Always run with --dry-run first to preview what will change.
 *
 * Algorithm:
 *   1. Load all MD files → map (block, day, type, category) → ULID
 *   2. Query block_day_tasks  → map uuid → (block, day, task_type, category)
 *   3. Join → old_uuid → new_ulid
 *   4. Find task_completions rows whose task_id does NOT start with "t_"
 *   5. UPDATE those rows (task_id only; data jsonb is untouched)
 *   6. Print a report
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import pg from "pg";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import matter from "gray-matter";
import { TaskFrontmatter } from "../src/features/content/program/schema";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/new_human_dev";
const PG_OPTIONS = "-c search_path=nhp,public";

const PROGRAM_ROOT = resolve(process.cwd(), "data", "program");
const DRY_RUN = process.argv.includes("--dry-run");

// ---------------------------------------------------------------------------
// Registry loader (inline — no Next.js server context here)
// ---------------------------------------------------------------------------

interface RegistryTask {
  id: string;
  block: number;
  day: number;
  type: string;
  category: string;
}

function loadRegistry(): Map<string, string> {
  // Returns: key `${block}:${day}:${dbTaskType}` → ulid
  const map = new Map<string, string>();

  function walk(dir: string): string[] {
    const out: string[] = [];
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return out;
    }
    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) out.push(...walk(full));
      else if (entry.endsWith(".md")) out.push(full);
    }
    return out;
  }

  for (const filePath of walk(PROGRAM_ROOT)) {
    const raw = readFileSync(filePath, "utf8");
    if (!raw.trimStart().startsWith("---")) continue;
    const parsed = matter(raw);
    const fm = TaskFrontmatter.safeParse(parsed.data);
    if (!fm.success) continue;
    const { id, block, day, type, category } = fm.data;
    // Bridge: registry uses type='info' for what the DB calls 'exercise'
    const dbType =
      type === "info" && category === "Physical" ? "exercise" : type;
    const key = `${block}:${day}:${dbType}`;
    if (map.has(key)) {
      console.warn(`⚠  Duplicate registry key ${key} — skipping ${filePath}`);
      continue;
    }
    map.set(key, id);
  }

  return map;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (DRY_RUN) {
    console.log("🔍 DRY RUN — no changes will be written\n");
  }

  const registry = loadRegistry();
  console.log(`📚 Loaded ${registry.size} tasks from markdown registry`);

  const client = new pg.Client({
    connectionString: DATABASE_URL,
    options: PG_OPTIONS,
  });
  await client.connect();

  try {
    // 1. Build uuid → (block, day, task_type) from block_day_tasks
    const { rows: dbTasks } = await client.query<{
      id: string;
      block_number: number;
      day_number: number;
      task_type: string;
      category: string;
    }>(
      "SELECT id, block_number, day_number, task_type, category FROM block_day_tasks"
    );
    console.log(`🗄  Found ${dbTasks.length} rows in block_day_tasks`);

    // Build old_uuid → new_ulid mapping
    const uuidToUlid = new Map<string, string>();
    const unmatchedDbTasks: string[] = [];

    for (const t of dbTasks) {
      const key = `${t.block_number}:${t.day_number}:${t.task_type}`;
      const newId = registry.get(key);
      if (newId) {
        uuidToUlid.set(t.id, newId);
      } else {
        unmatchedDbTasks.push(
          `  block=${t.block_number} day=${t.day_number} type=${t.task_type} uuid=${t.id}`
        );
      }
    }

    console.log(`🔗 Mapped ${uuidToUlid.size} DB tasks to registry ULIDs`);
    if (unmatchedDbTasks.length > 0) {
      console.log(
        `⚠  ${unmatchedDbTasks.length} DB tasks had no registry match (will not be migrated):`
      );
      unmatchedDbTasks.forEach((l) => console.log(l));
    }

    // 2. Find task_completions rows with old UUID task_ids
    const { rows: completions } = await client.query<{
      id: string;
      user_id: number;
      task_id: string;
    }>(
      // task_ids starting with 't_' are already in ULID format — skip them
      "SELECT id, user_id, task_id FROM task_completions WHERE task_id NOT LIKE 't_%'"
    );
    console.log(
      `\n📋 Found ${completions.length} completion rows with legacy UUID task_ids`
    );

    if (completions.length === 0) {
      console.log("✅ Nothing to migrate.");
      return;
    }

    // 3. Migrate
    // Build a set of (user_id, new_ulid) pairs that already exist in the DB so
    // we can detect conflicts before attempting the UPDATE.
    const { rows: existingUlidRows } = await client.query<{
      user_id: number;
      task_id: string;
    }>("SELECT user_id, task_id FROM task_completions WHERE task_id LIKE 't_%'");
    const existingUlidKeys = new Set(
      existingUlidRows.map((r) => `${r.user_id}:${r.task_id}`)
    );

    let migrated = 0;
    let deduped = 0;
    let noMapping = 0;
    const noMappingIds: string[] = [];

    for (const row of completions) {
      const newId = uuidToUlid.get(row.task_id);
      if (!newId) {
        noMapping++;
        if (noMappingIds.length < 10) noMappingIds.push(row.task_id);
        continue;
      }

      const conflictKey = `${row.user_id}:${newId}`;
      const hasConflict = existingUlidKeys.has(conflictKey);

      if (DRY_RUN) {
        if (hasConflict) {
          console.log(
            `  [dry-run] DELETE (duplicate) user=${row.user_id} ${row.task_id} — ULID row ${newId} already exists`
          );
        } else {
          console.log(
            `  [dry-run] UPDATE user=${row.user_id} ${row.task_id} → ${newId}`
          );
        }
      } else if (hasConflict) {
        // A ULID completion for this user+task already exists (user completed
        // the task via the new registry path after the registry was deployed).
        // The UUID row is a duplicate — delete it, keeping the ULID row.
        await client.query(
          "DELETE FROM task_completions WHERE id = $1",
          [row.id]
        );
        console.log(
          `  🗑  DELETE duplicate user=${row.user_id} ${row.task_id} (ULID ${newId} already exists)`
        );
        deduped++;
      } else {
        await client.query(
          "UPDATE task_completions SET task_id = $1 WHERE id = $2",
          [newId, row.id]
        );
        console.log(`  ✓ UPDATE user=${row.user_id} ${row.task_id} → ${newId}`);
        migrated++;
      }
    }

    console.log(`\n${DRY_RUN ? "[dry-run] Would run" : "✅ Done"}:`);
    console.log(`  ${migrated} rows updated (UUID → ULID)`);
    if (deduped > 0)
      console.log(`  ${deduped} duplicate UUID rows deleted (ULID already existed)`);

    if (noMapping > 0) {
      console.log(
        `⚠  ${noMapping} completion rows had UUIDs with no registry match (orphaned)`
      );
      noMappingIds.forEach((id) => console.log(`  ${id}`));
      if (noMapping > noMappingIds.length)
        console.log(`  … and ${noMapping - noMappingIds.length} more`);
    }

    if (!DRY_RUN) {
      // Verification query
      const { rows: remaining } = await client.query<{ count: string }>(
        "SELECT COUNT(*) AS count FROM task_completions WHERE task_id NOT LIKE 't_%'"
      );
      const leftover = parseInt(remaining[0].count);
      if (leftover === 0) {
        console.log(
          "\n✅ Verification passed — 0 legacy UUID task_ids remain in task_completions"
        );
      } else {
        console.log(
          `\n⚠  Verification: ${leftover} rows still have legacy UUID task_ids`
        );
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
