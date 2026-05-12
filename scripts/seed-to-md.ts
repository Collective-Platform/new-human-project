/**
 * Batch-generate program MD files from data/block1-seed.csv.
 *
 * For each CSV row that does NOT already have a corresponding MD file in
 * data/program/, this script creates the file and assigns a fresh ULID.
 *
 * Day 1 is skipped (files already exist). All other days are processed.
 * Running the script multiple times is safe — existing files are never
 * overwritten.
 *
 * After running, commit the generated files and the audit map. Then run
 * scripts/migrate-completions.ts to backfill task_completions.
 *
 * Usage:
 *   pnpm tsx scripts/seed-to-md.ts
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import matter from "gray-matter";
import { ulid } from "ulid";
import { TaskFrontmatter } from "../src/features/content/program/schema";

const ROOT = resolve(process.cwd(), "data", "program");
const CSV_PATH = resolve(process.cwd(), "data", "block1-seed.csv");
const MAP_PATH = resolve(ROOT, "migration-id-map.json");

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(raw: string): Record<string, string>[] {
  const lines = raw.split("\n").filter((l) => l.trim());
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Derive a file slug from the task row.
function fileSlug(row: Record<string, string>): string {
  const type = row.task_type;
  if (type === "mood_log") return "mood-log";
  if (type === "exercise") return "exercise";
  if (type === "scripture_reading") {
    // "Read Ephesians 1:3-6" → "read-ephesians-1-3-6"
    return toSlug(row.name);
  }
  // devotional: strip leading "Day N — "
  const title = row.name.replace(/^Day \d+\s*[—–-]\s*/i, "");
  return toSlug(title);
}

// ---------------------------------------------------------------------------
// Read existing Day 1 ULIDs from the already-written MD files.
// Key: `${block}:${day}:${dbTaskType}`
// ---------------------------------------------------------------------------

function collectExistingUlids(): Map<string, string> {
  const map = new Map<string, string>();

  function walk(dir: string) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (entry.endsWith(".md")) {
        try {
          const raw = readFileSync(full, "utf8");
          if (!raw.trimStart().startsWith("---")) continue;
          const parsed = matter(raw);
          const fm = TaskFrontmatter.safeParse(parsed.data);
          if (!fm.success) continue;
          const { block, day, type } = fm.data;
          // For Physical/info tasks the DB used 'exercise'; map that.
          const dbType = type === "info" && fm.data.category === "Physical" ? "exercise" : type;
          map.set(`${block}:${day}:${dbType}`, fm.data.id);
        } catch {
          // ignore
        }
      } else {
        try {
          const stat = statSync(full);
          if (stat.isDirectory()) walk(full);
        } catch {
          // ignore
        }
      }
    }
  }

  walk(ROOT);
  return map;
}

// ---------------------------------------------------------------------------
// Frontmatter + body builders
// ---------------------------------------------------------------------------

function buildDevotionalMd(row: Record<string, string>, id: string): string {
  const passageRef = row.passage_ref.trim();
  const focusEn = row.focus_en.trim();
  const readingNotesEn = row.reading_notes_en.trim();
  const keyIdeaEn = row.key_idea_en.trim();
  const reflectionEn = row.reflection_en.trim();
  const practiceEn = row.practice_en.trim();

  const fm = [
    "---",
    `id: ${id}`,
    `block: ${row.block}`,
    `day: ${row.day}`,
    `order: 20`,
    `category: Mental`,
    `type: devotional`,
    `name:`,
    `  en: ${JSON.stringify(row.name)}`,
    `  zh: ""`,
    passageRef ? `passageRef: ${JSON.stringify(passageRef)}` : null,
    `inputs:`,
    `  - reflection`,
    `  - practice`,
    "---",
  ]
    .filter((l) => l !== null)
    .join("\n");

  const sections: string[] = [];
  if (focusEn) sections.push(`## Today's Focus\n\n${focusEn}`);
  if (readingNotesEn) sections.push(`## Reading Notes\n\n${readingNotesEn}`);
  if (keyIdeaEn) sections.push(`## Key Idea\n\n${keyIdeaEn}`);
  if (reflectionEn) sections.push(`## Reflection\n\n${reflectionEn}`);
  if (practiceEn) sections.push(`## Today's Practice\n\n${practiceEn}`);

  return fm + "\n\n" + sections.join("\n\n") + "\n";
}

function buildScriptureMd(row: Record<string, string>, id: string): string {
  const ref = row.scripture_reference.trim();
  return [
    "---",
    `id: ${id}`,
    `block: ${row.block}`,
    `day: ${row.day}`,
    `order: 10`,
    `category: Mental`,
    `type: scripture_reading`,
    `name:`,
    `  en: ${JSON.stringify(row.name)}`,
    `  zh: ""`,
    ref ? `scriptureRef: ${JSON.stringify(ref)}` : null,
    "---",
    "",
  ]
    .filter((l) => l !== null)
    .join("\n");
}

function buildMoodLogMd(row: Record<string, string>, id: string): string {
  return [
    "---",
    `id: ${id}`,
    `block: ${row.block}`,
    `day: ${row.day}`,
    `order: 30`,
    `category: Emotional`,
    `type: mood_log`,
    `name:`,
    `  en: "Mood Log"`,
    `  zh: ""`,
    "---",
    "",
  ].join("\n");
}

function buildExerciseMd(row: Record<string, string>, id: string): string {
  return [
    "---",
    `id: ${id}`,
    `block: ${row.block}`,
    `day: ${row.day}`,
    `order: 40`,
    `category: Physical`,
    `type: info`,
    `name:`,
    `  en: "Exercise"`,
    `  zh: ""`,
    "---",
    "",
    "## Section",
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface MapEntry {
  block: number;
  day: number;
  dbTaskType: string;
  ulid: string;
}

async function main() {
  const raw = readFileSync(CSV_PATH, "utf8");
  const rows = parseCSV(raw);

  // Seed map with already-written Day 1 ULIDs.
  const existingUlids = collectExistingUlids();

  const mapEntries: MapEntry[] = [];
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const block = parseInt(row.block);
    const day = parseInt(row.day);
    const type = row.task_type;
    const mapKey = `${block}:${day}:${type}`;

    const dir = join(ROOT, `block-${block}`, `day-${day}`);
    const slug = fileSlug(row);
    const filePath = join(dir, `${slug}.md`);

    // Determine the ULID: use existing if we already have one, else generate.
    let taskId: string;
    if (existingUlids.has(mapKey)) {
      taskId = existingUlids.get(mapKey)!;
    } else {
      taskId = `t_${ulid()}`;
    }

    mapEntries.push({ block, day, dbTaskType: type, ulid: taskId });

    // Skip any task for which an MD file already exists in the registry
    // (identified by its ULID being present in existingUlids). This handles
    // cases where the existing filename differs from what this script would
    // generate (e.g. "letter-from-prison.md" vs "a-letter-written-from-prison.md").
    if (existingUlids.has(mapKey)) {
      skipped++;
      continue;
    }

    // Also skip if the exact filename already exists (belt-and-suspenders).
    if (existsSync(filePath)) {
      skipped++;
      continue;
    }

    mkdirSync(dir, { recursive: true });

    let content: string;
    if (type === "devotional") {
      content = buildDevotionalMd(row, taskId);
    } else if (type === "scripture_reading") {
      content = buildScriptureMd(row, taskId);
    } else if (type === "mood_log") {
      content = buildMoodLogMd(row, taskId);
    } else {
      // exercise
      content = buildExerciseMd(row, taskId);
    }

    writeFileSync(filePath, content);
    console.log(`  ✓ Created  ${filePath.replace(process.cwd() + "/", "")}`);
    created++;
  }

  // Sort map by block, day, then type for readability.
  mapEntries.sort((a, b) => {
    if (a.block !== b.block) return a.block - b.block;
    if (a.day !== b.day) return a.day - b.day;
    return a.dbTaskType.localeCompare(b.dbTaskType);
  });

  writeFileSync(MAP_PATH, JSON.stringify(mapEntries, null, 2) + "\n");

  console.log(`\n✅ Done: ${created} files created, ${skipped} already existed`);
  console.log(`📄 Migration map written to ${MAP_PATH.replace(process.cwd() + "/", "")}`);
  console.log(`\nNext: review the files, commit them, then run:`);
  console.log(`  pnpm tsx scripts/migrate-completions.ts --dry-run`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
