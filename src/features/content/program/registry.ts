import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { TaskFrontmatter, type ProgramTask } from "./schema";

/**
 * Loads `data/program/**\/*.md` into an in-memory registry keyed by frontmatter
 * `id`. The registry is the single source of truth for the daily program at
 * runtime; `task_completions.task_id` references these IDs.
 *
 * Loading is lazy (first call) and cached for the life of the process in
 * production. In development, markdown content is rebuilt on every read so
 * authors can change order/frontmatter/body and hard refresh without
 * restarting `next dev`. For explicit invalidation in tests, call
 * `_resetRegistry()`.
 */

const PROGRAM_ROOT = join(process.cwd(), "data", "program");

interface Registry {
  byId: Map<string, ProgramTask>;
  byDay: Map<string, ProgramTask[]>; // key: `${block}:${day}`
}

let cached: Registry | null = null;

function walkMarkdown(dir: string): string[] {
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
    if (stat.isDirectory()) {
      out.push(...walkMarkdown(full));
    } else if (entry.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

function build(): Registry {
  const byId = new Map<string, ProgramTask>();
  const byDay = new Map<string, ProgramTask[]>();

  const files = walkMarkdown(PROGRAM_ROOT);

  for (const filePath of files) {
    const raw = readFileSync(filePath, "utf8");
    // Only treat files with a leading frontmatter block as content. This lets
    // authors drop README.md / NOTES.md anywhere in the tree without the
    // loader trying to parse them as tasks.
    if (!raw.trimStart().startsWith("---")) continue;

    const parsed = matter(raw);
    const result = TaskFrontmatter.safeParse(parsed.data);
    if (!result.success) {
      throw new Error(
        `[program] invalid frontmatter in ${filePath}\n${formatZodError(result.error)}`,
      );
    }
    const task: ProgramTask = {
      ...result.data,
      body: parsed.content,
      filePath,
    };

    const existing = byId.get(task.id);
    if (existing) {
      throw new Error(
        `[program] duplicate task id ${task.id}\n  ${existing.filePath}\n  ${filePath}`,
      );
    }
    byId.set(task.id, task);

    const dayKey = `${task.block}:${task.day}`;
    const list = byDay.get(dayKey) ?? [];
    list.push(task);
    byDay.set(dayKey, list);
  }

  for (const list of byDay.values()) {
    list.sort((a, b) => a.order - b.order);
  }

  return { byId, byDay };
}

function formatZodError(err: unknown): string {
  if (
    err &&
    typeof err === "object" &&
    "issues" in err &&
    Array.isArray((err as { issues: unknown[] }).issues)
  ) {
    return (err as { issues: { path: (string | number)[]; message: string }[] }).issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
  }
  return String(err);
}

export function loadProgram(): Registry {
  if (process.env.NODE_ENV === "development") return build();
  if (!cached) cached = build();
  return cached;
}

export function getTaskById(id: string): ProgramTask | undefined {
  return loadProgram().byId.get(id);
}

export function getDayTasks(block: number, day: number): ProgramTask[] {
  return loadProgram().byDay.get(`${block}:${day}`) ?? [];
}

export function getAllTasks(): ProgramTask[] {
  return Array.from(loadProgram().byId.values());
}

/** Test/dev helper: drop the cache so the next call re-scans the FS. */
export function _resetRegistry(): void {
  cached = null;
}
