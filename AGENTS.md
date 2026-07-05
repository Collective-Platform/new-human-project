# Rhythm — Agent Context

## What Is This?

**Rhythm** is a bilingual (EN/ZH) Progressive Web App for building healthy habits across three dimensions: Mental, Emotional, and Physical. Community members follow a structured multi-week program of daily devotionals, scripture readings, mood logs, and exercises. Deployed on Vercel; installable as a mobile PWA.

---

## Stack

- **Next.js 16.2** ⚠️ — APIs, conventions, and file structure differ from your training data. Read `node_modules/next/dist/docs/` before writing any Next.js-specific code. Heed deprecation notices.
- React 19, TypeScript, Tailwind CSS 4, App Router
- **Drizzle ORM** + PostgreSQL via Neon serverless HTTP driver (`@neondatabase/serverless`)
- **next-intl** for i18n (EN/ZH, locale-parameterised routes at `/en/` and `/zh/`)
- **SWR** for client-side data fetching
- MailerSend (email OTP), Stripe (event payments), Web Push (notifications), YouVersion API (Bible scripture), Google Sheets API (live event sales)
- Linting: **oxlint / oxfmt** (Rust-based — NOT ESLint/Prettier)
- Package manager: **pnpm**

---

## Dev Commands

```bash
pnpm dev             # Start dev server (Turbopack)
pnpm build           # Production build
pnpm lint            # oxlint
pnpm fmt             # oxfmt (format in place)
pnpm fmt:check       # Check formatting (CI)
pnpm db:migrate      # Run Drizzle migrations against DB
pnpm db:generate     # Generate new migration from schema changes
pnpm db:reset-local  # Drop → recreate → migrate → seed local DB
pnpm content:new     # Scaffold a new markdown task file with a fresh immutable ULID
pnpm content:check   # Verify ULID content IDs are intact (run in CI)
```

> Content authoring workflow: see `data/program/README.md`.

---

## Project Structure

```
app/
  [locale]/           # All locale-aware routes (en | zh)
    landing/          # Public marketing page
    login/            # Email OTP login (→ /login/verify)
    signup/           # Email OTP signup (→ /signup/verify)
    onboarding/       # First-run setup flow
    (member)/         # Protected routes (auth required)
      page.tsx        # Dashboard / home
      progress/       # Daily tasks carousel
      community/      # Activity feed, friends
      profile/        # Profile + settings
      admin/          # Admin panel (role: admin only)
  live/               # Rhythm Live event page (no locale, no auth)
  api/                # All REST API routes
  components/         # Shared UI primitives (PrimaryButton, FieldInput, TogglePill)

src/
  db/
    schema.ts         # Drizzle schema — single source of truth for all tables
    index.ts          # DB client (Neon serverless)
  features/           # Business logic organised by domain
    auth/             # OTP flow, sessions, rate limiting, crypto
    progress/         # ProgressContext, task completions, streak queries
    content/          # Markdown content registry + Zod schema for task frontmatter
    community/        # Friends, activity feed, likes, caching
    notifications/    # Push subscriptions, daily reminders
    badges/           # Achievement definitions and earning logic
    bible/            # YouVersion API proxy
    live/             # Stripe checkout + Google Sheets sales tracking
    dashboard/        # Stats and home-screen queries
    admin/            # Admin-only queries
  i18n/               # next-intl config (routing, locale detection)
  env.ts              # Zod-validated env vars — always import from here

data/
  program/            # Daily program content as markdown files
    block-{N}/day-{N}/*.md   # One file = one task

messages/             # i18n JSON translation strings (en.json, zh.json)
DESIGN.md             # Visual design system spec
```

---

## Key Patterns

**Feature-based organisation** — all business logic lives in `src/features/<domain>/`. API routes in `app/api/` are thin: they validate input, call into features, and return responses. Never put DB queries directly in route handlers.

**Content-as-markdown** — the daily program lives in `data/program/` as `.md` files with Zod-validated frontmatter, loaded at runtime by the content registry (`src/features/content/`). No program content is stored in the DB. Task IDs (`t_` + 26-char ULID) are immutable — see _Critical Constraints_ below.

**Passwordless OTP auth** — no passwords. Flow: user enters email → 6-digit OTP sent via MailerSend → user verifies → session cookie set. Sessions stored as hashed tokens in the `sessions` table; the `pendingAuth` table holds pre-verification OTPs. Session user is cached per-request via React cache. Rate limiting is custom via the `rateLimitAttempts` table.

**i18n routing** — all member pages live under `app/[locale]/(member)/`. Use the i18n-aware `Link` from `src/i18n/navigation.ts`, not Next.js's built-in `Link`. UI strings come from `messages/en.json` / `messages/zh.json` via next-intl.

**Environment variables** — always import from `src/env.ts` (Zod-validated at startup). Never read `process.env` directly elsewhere.

**DB client** — import from `src/db/index.ts`. Uses Neon's HTTP driver — no raw TCP `pg` connection pooling. All tables are in the `nhp` Postgres schema, not `public`.

**Optimistic updates** — the progress page uses optimistic UI via `ProgressContext` (`src/features/progress/progress-context.tsx`) with rollback on API error. Preserve the `markComplete` / `markIncomplete` pattern when modifying this area.

---

## Database Tables

Key tables in `src/db/schema.ts`:

| Table                               | Purpose                                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `users`                             | id, email, role (user/admin/superuser), status (guest/active/inactive), displayName, searchHandle, privacyPublic, notificationPrefs (JSON) |
| `sessions`                          | hashed token, userId, expiresAt (30-day sliding renewal)                                                                                   |
| `pendingAuth`                       | pre-verification OTP records                                                                                                               |
| `rateLimitAttempts`                 | brute-force protection (5 req / 5 min per action + identifier)                                                                             |
| `taskCompletions`                   | userId + taskId (ULID format `t_…`) + completedAt + data (JSON)                                                                            |
| `memberBlockCompletions`            | block-level milestone records per user                                                                                                     |
| `friendRequests`                    | social graph edges (pending / accepted / rejected)                                                                                         |
| `pushSubscriptions`                 | per-device Web Push endpoints                                                                                                              |
| `likes`                             | userId + completionId                                                                                                                      |
| `notificationLog`                   | audit trail for all push notifications sent                                                                                                |
| `badgeDefinitions` / `memberBadges` | achievement system                                                                                                                         |

---

## Routes

```
/[locale]/landing              Public marketing
/[locale]/login                OTP login
/[locale]/signup               OTP signup
/[locale]/onboarding           First-run setup
/[locale]/                     Dashboard (member home)
/[locale]/progress             Daily tasks carousel
/[locale]/community            Activity feed + friends
/[locale]/community/[handle]   Public user profile
/[locale]/profile              Own profile
/[locale]/profile/settings     Avatar, name, privacy, notification prefs
/[locale]/admin                Admin panel (role: admin only)
/live                          Rhythm Live event (no auth, no locale)
```

---

## Design System

See `DESIGN.md` — the full visual spec lives there (colors, typography, spacing, shadows, component specs). Always read DESIGN.md before touching UI. Do not duplicate it here.

---

## Critical Constraints

- **ULID content IDs are immutable** — never edit the `id:` field in any `data/program/**/*.md` file after it has been merged. `taskCompletions.task_id` references these. CI (`pnpm content:check`) will block any PR that mutates an existing id. Always use `pnpm content:new` to create files.
- **No passwords** — auth is OTP-only. Do not add password fields to users or auth flows.
- **Neon serverless driver** — use `@neondatabase/serverless`, never a native TCP `pg` pool in serverless functions.
- **`nhp` Postgres schema** — all tables live in schema `nhp`, not `public`. Drizzle handles this; don't write raw SQL that assumes `public`.
- **Oxlint / Oxfmt only** — not ESLint/Prettier. Run `pnpm lint` and `pnpm fmt:check` before committing.
- **Bilingual** — every UI surface must work in both English and Simplified Chinese. Test locale switching when changing UI.
