/**
 * CI guard: frontmatter `id` is IMMUTABLE.
 *
 * For every `data/program/**\/*.md` file present in both the base ref and
 * HEAD, fail if its frontmatter `id` changed. New files (only in HEAD) and
 * deleted files (only in base) are allowed.
 *
 * Usage:
 *   pnpm content:check                # diff against `main`
 *   BASE_REF=origin/main pnpm content:check
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import matter from "gray-matter";

const BASE_REF = process.env.BASE_REF ?? "main";

function git(cmd: string): string {
  return execSync(cmd, { encoding: "utf8" });
}

let headFiles: string[] = [];
try {
  headFiles = git(`git ls-tree -r --name-only HEAD -- data/program`)
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.endsWith(".md"));
} catch {
  console.log("✓ No HEAD or no data/program tree; nothing to check.");
  process.exit(0);
}

const violations: string[] = [];
let checked = 0;

for (const file of headFiles) {
  let baseContent: string;
  try {
    baseContent = git(`git show ${BASE_REF}:${file}`);
  } catch {
    // File is new in HEAD — no immutability concern.
    continue;
  }

  let headContent: string;
  try {
    headContent = readFileSync(file, "utf8");
  } catch {
    // File deleted in working tree but still in HEAD index — skip.
    continue;
  }

  const baseId = matter(baseContent).data?.id;
  const headId = matter(headContent).data?.id;
  checked++;

  if (typeof baseId === "string" && typeof headId === "string" && baseId !== headId) {
    violations.push(`${file}\n    was: ${baseId}\n    now: ${headId}`);
  }
}

if (violations.length > 0) {
  console.error(`✗ Frontmatter \`id\` is immutable. ${violations.length} violation(s):\n`);
  for (const v of violations) console.error("  " + v + "\n");
  console.error(
    "If you really need a new id (e.g. retiring content), add a NEW file " +
      "with a fresh ULID and remove the old one in a separate PR.",
  );
  process.exit(1);
}

console.log(`✓ Frontmatter ids preserved across ${checked} file(s).`);
