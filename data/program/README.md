# Program content

The daily program (devotionals, scripture readings, mood logs, intros,
emotional content, etc.) lives here as markdown files. One file = one task.

See [`docs/design/001-content-as-markdown.md`](../../docs/design/001-content-as-markdown.md)
for the full design.

## Layout

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
│  └─ day-2/
└─ block-2/
```

The numeric prefix on filenames is **for humans browsing the folder only**.
Real ordering comes from frontmatter `order:`.

## Authoring

**Always** use the scaffolder to create new files. It generates a fresh
immutable ULID id for you:

```sh
pnpm content:new <block> <day> <type> <slug> [category]

# Examples:
pnpm content:new 1 1 devotional letter-from-prison
pnpm content:new 1 1 info mental-intro Mental
pnpm content:new 1 1 mood_log mood-log Emotional
```

## Editing rules

- ✅ Edit any frontmatter field — except `id`.
- ✅ Edit the markdown body freely. Add or rename `## Headings`.
- ✅ Reorder by changing `order:`. Use sparse values (10, 20, 30…) so you
  can insert at 15 without renumbering everything.
- ✅ Move files between folders. The folder path is purely cosmetic.
- ❌ **Never edit `id:`** once a file has been merged to `main`.
  `task_completions.task_id` references it. CI (`pnpm content:check`) will
  block any PR that mutates an existing id.

If you truly need to retire a piece of content: delete the file. Existing
user completions for that id will be preserved in the DB but hidden from
progress views.

## Frontmatter reference

```yaml
---
id: t_01HXYZK4N9P7QF3M2A8B1C9D0E   # ULID, IMMUTABLE
block: 1
day: 1
order: 40                           # sort key within (block, day)
category: Mental                    # Mental | Emotional | Physical
type: devotional                    # devotional | scripture_reading
                                    #  | scripture_study | mood_log | info
name:
  en: "Day 1 — A Letter Written from Prison"
  zh: "..."

# Optional, type-specific:
passageRef: "Ephesians 1:1–2 · Acts 19"
scriptureRef: "Ephesians 1:1-2"
videoUrl: "https://..."

# Which `## Heading` sections capture user-typed text:
inputs:
  - reflection
  - practice
---
```
