# 001 — Program Content as Markdown

**Status:** Draft
**Author:** —
**Date:** 2026-05-06
**Related PRD:** [`prd-the-new-human-project.md`](../../../prd-the-new-human-project.md)

---

## Context

Today the daily program (devotionals, scripture readings, mood log, etc.) lives in
the Postgres table `nhp.block_day_tasks`, populated from `data/block1-seed.csv`
via `pnpm db:seed`. Two pain points are blocking content work:

1. **Reordering or inserting tasks requires a destructive reseed.** The seed
   wipes and reinserts. Any change — swap scripture/devotional order, insert a
   new "Introduction" task, fix a typo — forces nuking and re-running.
2. **The renderer schema is rigid.** `DevotionalRenderer` has hard-coded fields
   (`focus`, `readingNotes`, `keyIdea`, `reflection`, `practice`). Adding new
   sections, variant headings, or new content types (Introduction, Movement
   Introduction, Emotional Content for Days 1/12/25) means schema changes and
   new renderer components for what is structurally the same kind of content.

A third concern is forward-looking: this is a multi-block, multi-year program.
More content variations are coming. The current model scales by adding columns
and renderers; we want a model that scales by editing files.

## Goals

- Reorder, insert, and edit program content via a normal git PR — no DB reseed.
- One generic renderer covers devotionals, introductions, movement intros, and
  emotional content. Adding a new heading is zero code.
- Content lives in human-readable markdown, type-checked at load time.
- `task_completions` keeps working across renames, reorders, and folder
  restructures — i.e., the FK is **immutable** and decoupled from path.

## Non-goals

- Building a CMS or admin UI. (Future work; the design does not preclude one.)
- Migrating user/community/session data out of Postgres.
- Changing the mood log or bilingual scripture passage UI.
- Localized markdown bodies in this iteration. (Frontmatter `name` is i18n-keyed;
  body is single-language for now. Adding `body.zh.md` siblings is an additive
  later change.)

## Proposal

### File layout

```
data/program/
├─ block-1/
│  ├─ day-1/
│  │  ├─ 10-mental-intro.md
│  │  ├─ 20-movement-intro.md
│  │  ├─ 30-scripture-reading.md
│  │  ├─ 40-devotional-letter-from-prison.md
│  │  ├─ 50-mood-log.md
│  │  └─ 60-emotional-awareness.md
│  ├─ day-2/
│  └─ ...
└─ block-2/...
```

Filename numeric prefix is **for humans browsing the folder only**. Real ordering
comes from frontmatter `order:`. Folders may be restructured at any time.

### Frontmatter schema (Zod)

```yaml
---
id: t_01HXYZK4N9P7QF3M2A8B1C9D0E # ULID, prefixed "t_" — IMMUTABLE
block: 1
day: 1
order: 40 # sparse (10, 20, 30...) for easy inserts
category: Mental # Mental | Emotional | Physical
type:
  devotional # devotional | scripture_reading | mood_log
  #  | info | (extensible)
name:
  en: "Day 1 — A Letter Written from Prison"
  zh: "..."

# Optional, type-specific:
passageRef: "Ephesians 1:1–2 · Acts 19" # devotional
scriptureRef: "Ephesians 1:1-2" # scripture_reading
videoUrl: "https://..." # any
inputs: # which sections capture user text
  - reflection
  - practice
---
## Reading Notes
...
## Key Idea
...
## Reflection
...
## Today's Practice
...
```

The Zod schema validates frontmatter at load time. Unknown frontmatter keys are
allowed (forward-compatible). Unknown section headings render as plain prose.

### ID strategy

- Format: `t_` + ULID (26 chars). 28 chars total.
- Generated once via `pnpm content:new` (script writes a fresh file with ID
  pre-filled). Authors never type IDs.
- **Immutable contract:** once an ID is in `main`, it never changes. CI lint
  fails any PR that mutates an existing `id:` line.
- Stored in `task_completions.task_id` as `text`.

### Loader & registry

At server start (and in dev on file change):

1. Glob `data/program/**/*.md`.
2. Parse frontmatter (`gray-matter`), validate with Zod.
3. Build `Map<id, Task>` keyed by frontmatter ID.
4. Build a per-day index `Map<\`${block}:${day}\`, Task[]>`sorted by`order`.
5. On duplicate ID or schema violation, throw at boot (fail loud).

Body markdown is parsed lazily (on render) into sections by H2.

### Renderer model

Replace per-type renderers with a single `SectionedContentRenderer`:

- Splits body on `## ` headings → `[{ heading, markdown }]`.
- Renders each section as markdown by default.
- Recognizes a small set of "special" sections by name:
  - `## Key Idea` → blockquote/callout style (existing primary-tinted box).
  - `## Reflection` → markdown + `<ReflectionInput name="reflection">` if
    `inputs` includes `"reflection"`.
  - `## Today's Practice` → same pattern with `name="practice"`.
- Frontmatter `passageRef` / `scriptureRef` render as a header above the body.

`MoodLogRenderer` and `BilingualPassage` remain as-is — they have genuinely
custom UI that isn't markdown-shaped.

### Reflection input

New component `<ReflectionInput name="...">`:

- Textarea, debounced autosave (1s) → `POST /api/tasks/complete` with
  `data: { [name]: text }`.
- Reads initial value from `task.completionData[name]`.
- No new table. Reuses `task_completions.data jsonb`.

### Schema change

```diff
  task_completions
- task_id uuid REFERENCES block_day_tasks(id) ON DELETE CASCADE
+ task_id text NOT NULL
```

Drop the FK. The application layer is responsible for resolving `task_id` to a
loaded program task. Orphaned completions (content retired) are tolerated:
filtered out of progress views, preserved for history.

`block_day_tasks` and `data/block1-seed.csv` and `src/db/seed.ts` are removed
once migration is complete.

### Tooling

- `pnpm content:new <block> <day> <type> <slug>` — scaffolds a new MD file
  with a fresh ULID.
- CI check: any PR that changes an existing frontmatter `id:` line fails.
- CI check: loader runs at build time; schema violations fail the build.

## Migration plan

1. **Schema & infra.** Add Zod schema, ULID generator, `pnpm content:new`,
   loader + registry, CI ID-immutability check. No app behavior change yet.
2. **Renderer.** Build `SectionedContentRenderer` + `<ReflectionInput>`. Wire
   into `task-detail.tsx` behind a feature switch keyed off whether the task
   came from the program registry vs. the DB.
3. **Pilot — Block 1, Day 1.** Author the day's MD files. Introduce a parallel
   data path: queries can pull tasks from the registry first, fall back to DB.
   Verify completions roundtrip end-to-end (create completion via new path,
   read it back, render reflection text, navigate days).
4. **Migrate Block 1.** Convert remaining days. Add Day 1/12/25 emotional
   content as separate MD files.
5. **Cut over.** Remove DB fallback in queries. Drop `block_day_tasks`,
   `data/block1-seed.csv`, `src/db/seed.ts`. Migration to alter
   `task_completions.task_id` → `text` and drop the FK.

Each step is a separate PR. Steps 1–2 are reversible. Step 5 is the one-way
door.

### Compatibility & cutover work

User-facing behavior does **not** change:

- A task is "done" iff a row exists in `task_completions` for `(user_id, task_id)`.
  Same model before and after; only the ID _format_ changes (UUID → ULID text).
- The "Next" button in `task-detail.tsx` still calls
  `onComplete(task.id)` then navigates. The optimistic patch in
  `progress-client.tsx` keys off `task.id` as a string and is unaffected.
- There is no "uncomplete" today (`POST /api/tasks/complete` does
  `ON CONFLICT DO UPDATE`). Migration does not add or remove undo.
- `POST /api/tasks/complete` request/response shape is unchanged: the client
  still sends `{ taskId, data }`. Only the _value_ of `taskId` differs.

Three queries currently SQL-JOIN `task_completions` against `block_day_tasks`
and must be rewritten to resolve task IDs through the in-memory program
registry before step 5:

1. **Block completion check** in [`app/api/tasks/complete/route.ts`](../../app/api/tasks/complete/route.ts)
   (the "≥3 categories completed" JOIN). Replacement: load the user's
   completions, look up each task ID's `category` from the registry, count
   distinct categories.
2. **Per-day "any task done" map** in
   [`src/features/progress/queries.ts → getDayCompletionStates`](../../src/features/progress/queries.ts).
   Replacement: load completions, group by `registry.get(id).day`.
3. **Fully-completed days set** in `getFullyCompletedDays` (same file).
   Replacement: pull the day's task IDs from the registry, intersect with the
   user's completion set.

`src/features/dashboard/queries.ts` and `src/features/community/queries.ts`
also reference `block_day_tasks`. Audit during step 4; apply the same
registry-resolution pattern.

## Risks & open questions

- **Orphaned completions.** If a piece of content is retired, its ID still
  exists in `task_completions`. Decision: keep the row, hide from progress UI,
  surface in a "history" view if we ever build one. Acceptable.
- **Existing dev completions.** Pre-migration completions reference the old
  UUID FK. Decision: wipe `task_completions` in dev as part of step 5; we have
  no production users yet. Document this in the migration PR.
- **i18n of body markdown.** Out of scope for this doc. Sketch: sibling files
  `letter-from-prison.en.md` / `letter-from-prison.zh.md` discovered by the
  loader, picked by request locale.
- **Authoring workflow for non-developers.** Currently requires a PR. If the
  pastor / content team needs direct editing later, evaluate Decap CMS or
  Tina (both git-backed, no DB).
- **Section-name coupling.** The renderer recognizes `Reflection` and
  `Today's Practice` by literal heading text. If a future devotional needs a
  different heading for the textarea, declare it via frontmatter `inputs:`
  with an explicit section mapping. Not needed for v1.

## Rejected alternatives

- **A: Code-only ordering, keep DB rows.** Two sources of truth (rows + order
  map). Every new task must be added in two places.
- **B: Add `slug` + UPSERT seed + sparse `display_order`.** Cheapest fix, but
  doesn't address renderer rigidity or the upcoming content-variety problem.
  Worth doing if we decided _not_ to migrate; we are migrating, so skipped.
- **D: Hybrid (DB rows for task list, MD for body).** Useful only if we
  planned an admin UI for task ordering. We don't.
- **MDX instead of MD.** More power (custom React components inside content),
  more complexity, no current need. Revisit if a content piece needs
  interactive widgets beyond `ReflectionInput`.
