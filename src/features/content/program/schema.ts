import { z } from "zod";

/**
 * Frontmatter schema for `data/program/**\/*.md` files.
 *
 * Each markdown file represents a single program task (devotional, scripture
 * reading, mood log, intro, etc.). Frontmatter is the typed contract between
 * authoring (markdown files) and runtime (renderer + completions).
 *
 * The `id` field is **immutable** once a file is merged to main. Authors must
 * never edit it. Use `pnpm content:new` to scaffold new files with a fresh
 * ULID-based id.
 */

export const TaskCategory = z.enum(["Mental", "Emotional", "Physical"]);
export type TaskCategory = z.infer<typeof TaskCategory>;

/**
 * Renderer types. Add new entries here when introducing a new renderer.
 *
 * - devotional        → SectionedContentRenderer (devotional layout)
 * - scripture_reading → BilingualPassage
 * - scripture_study   → SectionedContentRenderer (study layout)
 * - mood_log          → MoodLogRenderer
 * - info              → SectionedContentRenderer (intros, movement intros,
 *                       emotional content — anything markdown-shaped)
 */
export const TaskType = z.enum([
  "devotional",
  "scripture_reading",
  "scripture_study",
  "mood_log",
  "info",
]);
export type TaskType = z.infer<typeof TaskType>;

/**
 * Localized string. Either a bare string (single-locale content) or a record
 * keyed by locale code. `getLocalizedString()` already handles both shapes.
 */
export const LocalizedString = z.union([
  z.string(),
  z.looseObject({
    en: z.string().optional(),
    zh: z.string().optional(),
  }),
]);
export type LocalizedString = z.infer<typeof LocalizedString>;

/**
 * Matches `t_` followed by a 26-character Crockford base-32 ULID.
 */
const TASK_ID_PATTERN = /^t_[0-9A-HJKMNP-TV-Z]{26}$/;

export const TaskFrontmatter = z.looseObject({
  id: z
    .string()
    .regex(
      TASK_ID_PATTERN,
      "id must be 't_' followed by a 26-char ULID (use `pnpm content:new`)",
    ),
  block: z.number().int().positive(),
  day: z.number().int().positive(),
  order: z.number().int().nonnegative(),
  category: TaskCategory,
  type: TaskType,
  name: LocalizedString,

  // Type-specific optional fields. `looseObject` allows additional keys for
  // forward compatibility — the renderer pulls what it knows about and
  // ignores the rest.
  passageRef: z.string().optional(),
  scriptureRef: z.string().optional(),
  videoUrl: z.url().optional(),

  /**
   * Section names (matching `## Heading` text) that should render with a
   * `<ReflectionInput>`. The submitted text is stored in
   * `task_completions.data` keyed by the section slug.
   */
  inputs: z.array(z.string()).optional(),
});
export type TaskFrontmatter = z.infer<typeof TaskFrontmatter>;

/**
 * A loaded task: validated frontmatter + raw markdown body + source path.
 */
export interface ProgramTask extends TaskFrontmatter {
  body: string;
  filePath: string;
}
