/**
 * Scaffold a new program content file with a fresh, immutable ULID-based id.
 *
 * Usage:
 *   pnpm content:new <block> <day> <type> <slug> [category]
 *
 * Examples:
 *   pnpm content:new 1 1 devotional letter-from-prison
 *   pnpm content:new 1 1 info mental-intro Mental
 *   pnpm content:new 1 1 mood_log mood-log Emotional
 *
 * Defaults:
 *   category = Mental
 *   order    = (max existing order in that day) + 10, else 10
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { ulid } from "ulid";
import { TaskFrontmatter, TaskType, TaskCategory } from "../src/features/content/program/schema";

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 4) {
  fail(
    "Usage: pnpm content:new <block> <day> <type> <slug> [category]\n" +
      "Example: pnpm content:new 1 1 devotional letter-from-prison",
  );
}

const block = Number(args[0]);
const day = Number(args[1]);
const typeArg = args[2];
const slug = args[3];
const categoryArg = args[4] ?? "Mental";

if (!Number.isInteger(block) || block <= 0) fail(`Invalid block: ${args[0]}`);
if (!Number.isInteger(day) || day <= 0) fail(`Invalid day: ${args[1]}`);

const typeParsed = TaskType.safeParse(typeArg);
if (!typeParsed.success) {
  fail(`Invalid type: "${typeArg}". Expected one of: ${TaskType.options.join(", ")}`);
}
const categoryParsed = TaskCategory.safeParse(categoryArg);
if (!categoryParsed.success) {
  fail(`Invalid category: "${categoryArg}". Expected one of: ${TaskCategory.options.join(", ")}`);
}

if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  fail(`Invalid slug: "${slug}". Use lowercase letters, digits, and hyphens.`);
}

const dir = join(process.cwd(), "data", "program", `block-${block}`, `day-${day}`);
const filePath = join(dir, `${slug}.md`);
if (existsSync(filePath)) fail(`File already exists: ${filePath}`);

// Compute next order = (max existing order in this day) + 10
let nextOrder = 10;
if (existsSync(dir)) {
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith(".md")) continue;
    try {
      const fm = matter(readFileSync(join(dir, entry), "utf8")).data;
      const parsed = TaskFrontmatter.safeParse(fm);
      if (parsed.success && parsed.data.order >= nextOrder) {
        nextOrder = parsed.data.order + 10;
      }
    } catch {
      // ignore unreadable / invalid files; user will see schema errors at load time
    }
  }
}

const id = `t_${ulid()}`;

const template = `---
id: ${id}
block: ${block}
day: ${day}
order: ${nextOrder}
category: ${categoryParsed.data}
type: ${typeParsed.data}
name:
  en: ""
  zh: ""
---

## Section

`;

mkdirSync(dir, { recursive: true });
writeFileSync(filePath, template);

console.log(`✓ Created ${filePath}`);
console.log(`  id:    ${id}`);
console.log(`  order: ${nextOrder}`);
console.log("\nReminder: the `id` field is IMMUTABLE once merged. Do not edit it.");
