/**
 * Content seed script
 *
 * Reads a CSV file and inserts Block 1 content into block_day_tasks,
 * packing _en/_zh columns into locale-keyed JSONB (PRD Req 96).
 *
 * Usage: pnpm db:seed [path/to/csv]
 *   Default CSV: data/block1-seed.csv
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/new_human_dev";

// All NHP tables live in the `nhp` Postgres schema. Set search_path so
// unqualified INSERT statements resolve into nhp.
const PG_OPTIONS = "-c search_path=nhp,public";

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
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

function buildContent(row: Record<string, string>): Record<string, unknown> {
  const taskType = row.task_type;

  if (taskType === "devotional") {
    return withIntroMarkdown(row, {
      passage_ref: row.passage_ref || null,
      focus: buildLocaleObj(row.focus_en, row.focus_zh),
      reading_notes: buildLocaleObj(row.reading_notes_en, row.reading_notes_zh),
      key_idea: buildLocaleObj(row.key_idea_en, row.key_idea_zh),
      reflection: buildLocaleObj(row.reflection_en, row.reflection_zh),
      practice: buildLocaleObj(row.practice_en, row.practice_zh),
      xp_weight: parseInt(row.xp_weight) || 2,
    });
  }

  if (taskType === "scripture_reading") {
    return {
      scripture_reference: row.scripture_reference || null,
      xp_weight: parseInt(row.xp_weight) || 1,
    };
  }

  if (taskType === "scripture_study") {
    return withIntroMarkdown(row, {
      scripture_reference: row.scripture_reference || null,
      scripture_text: buildLocaleObj(
        row.scripture_text_en,
        row.scripture_text_zh
      ),
      explanation: buildLocaleObj(row.explanation_en, row.explanation_zh),
      video_url: row.video_url || null,
      xp_weight: parseInt(row.xp_weight) || 2,
    });
  }

  // mood_log and exercise have no seeded content
  return {};
}

function withIntroMarkdown(
  row: Record<string, string>,
  content: Record<string, unknown>
): Record<string, unknown> {
  const intro = buildLocaleObj(
    readOptionalTaskContent(row, "intro", "en"),
    readOptionalTaskContent(row, "intro", "zh")
  );

  if (!intro) return content;

  return {
    ...content,
    intro_markdown: intro,
  };
}

function readOptionalTaskContent(
  row: Record<string, string>,
  name: string,
  locale: "en" | "zh"
): string {
  const filePath = resolve(
    "data/task-content-overrides",
    `block-${row.block}`,
    `day-${row.day}`,
    `order-${row.order}`,
    `${name}.${locale}.md`
  );

  if (!existsSync(filePath)) return "";
  return readFileSync(filePath, "utf-8");
}

function buildLocaleObj(
  en: string | undefined,
  zh: string | undefined
): Record<string, string> | null {
  const obj: Record<string, string> = {};
  if (en?.trim()) obj.en = en.trim();
  if (zh?.trim()) obj.zh = zh.trim();
  return Object.keys(obj).length > 0 ? obj : null;
}

async function seed() {
  const csvPath = resolve(
    process.argv[2] ?? "data/block1-seed.csv"
  );
  const raw = readFileSync(csvPath, "utf-8");
  const rows = parseCSV(raw);

  const client = new pg.Client({
    connectionString: DATABASE_URL,
    options: PG_OPTIONS,
  });
  await client.connect();

  try {
    console.log(`📖 Reading ${rows.length} rows from ${csvPath}\n`);

    let inserted = 0;
    let updated = 0;
    for (const row of rows) {
      const content = buildContent(row);
      const params = [
        parseInt(row.block),
        parseInt(row.day),
        row.category,
        row.task_type,
        row.name,
        JSON.stringify(content),
        parseInt(row.order),
      ];

      const updateResult = await client.query(
        `UPDATE block_day_tasks
         SET name = $5, content = $6, updated_at = now()
         WHERE block_number = $1
           AND day_number = $2
           AND category = $3
           AND task_type = $4
           AND display_order = $7`,
        params
      );

      if (updateResult.rowCount && updateResult.rowCount > 0) {
        updated += updateResult.rowCount;
        continue;
      }

      await client.query(
        `INSERT INTO block_day_tasks (id, block_number, day_number, category, task_type, name, content, display_order)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)`,
        params
      );
      inserted++;
    }

    console.log(
      `  ✅ Synced block_day_tasks (${inserted} inserted, ${updated} updated)`
    );

    // 2.15: Seed Block 1 badge definition
    await client.query(
      `INSERT INTO badge_definitions (id, name, description, block_number, is_milestone)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [
        "Block 1 Complete",
        "Completed the first 25-day formation block — The Foundation",
        1,
        true,
      ]
    );
    console.log("  ✅ Seeded Block 1 badge definition");

    console.log("\n🌱 Content seeding complete!");
  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
