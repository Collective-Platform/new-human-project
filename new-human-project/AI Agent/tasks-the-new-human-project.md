## Relevant Files

- `src/app/layout.tsx` - Root layout with NextIntlClientProvider, font loading (Plus Jakarta Sans, Manrope, Noto Sans SC), Tailwind setup
- `src/app/layout.test.tsx` - Unit tests for root layout
- `src/features/auth/` - Email OTP authentication shared with giving-platform (login, OTP verify, session management)
- `src/features/auth/auth.test.ts` - Unit tests for auth logic
- `src/features/blocks/` - 25-day block system (day calculation, block completion detection)
- `src/features/blocks/blocks.test.ts` - Unit tests for block logic
- `src/features/tasks/` - Generic task renderer architecture and task completion API
- `src/features/tasks/renderers/scripture-memorise/` - Level 1 Mental renderer (memorise verse)
- `src/features/tasks/renderers/scripture-study/` - Level 2 Mental renderer (study passage + explanation + video)
- `src/features/tasks/renderers/mood-log/` - Emotional mood log renderer (emoji → influences → free-text)
- `src/features/tasks/renderers/exercise/` - Physical exercise tick-box renderer
- `src/features/tasks/tasks.test.ts` - Unit tests for task renderers and completion logic
- `src/features/streaks/` - Streak calculation (computed on read from task_completions)
- `src/features/streaks/streaks.test.ts` - Unit tests for streak logic
- `src/features/community/` - Friends, friend requests, activity feed, people you may know
- `src/features/community/community.test.ts` - Unit tests for community features
- `src/features/badges/` - Badge definitions, badge awarding on block completion
- `src/features/badges/badges.test.ts` - Unit tests for badge logic
- `src/features/notifications/` - Web Push API integration, service worker registration, notification preferences
- `src/features/notifications/notifications.test.ts` - Unit tests for notification logic
- `src/features/admin/` - Admin daily content manager (bilingual EN/ZH editing)
- `src/features/admin/admin.test.ts` - Unit tests for admin features
- `src/i18n/messages/en.json` - English UI string translations (next-intl)
- `src/i18n/messages/zh.json` - Chinese UI string translations (next-intl)
- `src/i18n/request.ts` - next-intl request configuration
- `src/i18n/locale.ts` - Client-side locale hook (localStorage + cookie)
- `src/db/schema.ts` - Drizzle ORM schema with snake_case DB casing / camelCase TypeScript (block_day_tasks, task_completions, member_block_completions, badges, friends, push_subscriptions, etc.). Users table has serial INTEGER PK (from giving-platform), all formation FKs reference INTEGER user_id.
- `src/db/shared-schema.ts` - Read-only Drizzle schema references for giving-platform shared tables (users, sessions, tokens, rate_limit_attempts) — DO NOT create or modify these tables
- `src/db/index.ts` - Database client setup with dual connection modes: local `postgres` (pg driver for dev) and `drizzle-orm/neon-http` / `drizzle-orm/neon-serverless` (production)
- `docker-compose.yml` or local Homebrew Postgres — local development database (all tables created locally, including giving-platform shared tables)
- `src/db/seed-dev.ts` - Development seed script that creates test users, sessions, and sample data for local development
- `src/db/schema.test.ts` - Unit tests for schema definitions
- `src/db/seed.ts` - Content seeding script (reads CSV, inserts bilingual JSONB content)
- `public/manifest.json` - PWA manifest (app name, icons, theme colour)
- `public/sw.js` - Service worker for push notifications + offline caching
- `drizzle/migrations/` - Database migration files
- `tailwind.config.ts` - Tailwind config with category colours, font stacks, design tokens

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `pnpm test` to run tests (project uses pnpm as package manager).
- The project shares authentication DB tables with the existing giving-platform — do NOT modify the structure of `users`, `sessions`, `tokens`, or `rate_limit_attempts` tables beyond the specified ALTER TABLE additions.
- **Production** database is hosted on **PlanetScale** (Postgres-compatible). The `@neondatabase/serverless` package is the **connection driver only** for production, not the hosting provider.
- **Local development** uses Homebrew Postgres (`postgresql@16`) with a standard `postgres` connection string. All tables (including giving-platform shared tables) are created locally so development doesn't require PlanetScale access or incur costs.
- Drizzle ORM uses **snake_case** casing strategy in the database and **camelCase** in TypeScript. The DB client (`src/db/index.ts`) switches between local `pg` driver (dev) and `neon-http`/`neon-serverless` (production) based on a `DATABASE_PROVIDER` env var.
- The giving-platform `users` table uses **serial INTEGER** primary key (`id`), not UUID. All formation-specific foreign keys (`user_id`) must reference **INTEGER**, not UUID.
- Giving-platform user roles are `'user'` / `'admin'` / `'su'` — **NOT** `'member'`. The default role is `'user'`.
- User status lifecycle: `'guest'` → `'active'` → `'suspended'` / `'deleted'` (four states).
- Existing users table columns (from giving-platform): `id` (serial PK), `email` (varchar 254), `email_verified_at` (timestamptz), `first_name` (varchar 32), `last_name` (varchar 32), `role` (text enum), `status` (text enum), `journey` (text).
- Other giving-platform tables that exist but are NOT used by formation: `funds`, `transactions`, `transaction_items`, `payments`, `saved_payment_methods`, `user_settings`.
- Reference the wireframe in `/google-stitch.rtf` for visual design decisions.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/the-new-human-project`)

- [ ] 1.0 Project Initialisation & Configuration
  - [ ] 1.1 Initialise a Next.js 14+ project with App Router using `pnpm create next-app` with TypeScript, Tailwind CSS, ESLint, and `src/` directory enabled
  - [ ] 1.2 Install core dependencies: `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless` (connection driver for PlanetScale), `next-intl`, `web-push`, `workbox-webpack-plugin` (and dev deps: `drizzle-kit`, `@types/*`). Note: `@neondatabase/serverless` is the driver, not the hosting provider — the DB is on PlanetScale
  - [ ] 1.3 Configure `tailwind.config.ts` with the design system tokens from the PRD: category colours (Physical `#fff7e4`, Mental `#ee1c24`, Emotional `#679fff`), primary `#c10014`, secondary `#135db9`, tertiary `#645f50`, surface palette `#fef8f5`, border-radius presets (`1rem`, `2rem`, `3rem`, `9999px`), card shadow (`0 12px 32px rgba(53,50,47,0.06)`), and font families with CJK fallbacks (headline: Plus Jakarta Sans + Noto Sans SC + PingFang SC + Microsoft YaHei; body: Manrope + Noto Sans SC + PingFang SC + Microsoft YaHei)
  - [ ] 1.4 Set up Google Fonts loading for Plus Jakarta Sans, Manrope, and Noto Sans SC with `font-display: swap` in the root layout
  - [ ] 1.5 Create the `public/manifest.json` PWA manifest with app name "The New Human Project", theme colour `#c10014`, background colour `#fef8f5`, display `standalone`, appropriate icon sizes
  - [ ] 1.6 Set up the project folder structure as specified in the PRD: `/src/features/{auth,blocks,tasks,streaks,community,badges,notifications,admin}`, `/src/i18n/`, `/messages/`
  - [ ] 1.7 Configure environment variables: `DATABASE_URL` (local: `postgres://localhost:5432/new_human_dev`, production: PlanetScale connection string), `DATABASE_PROVIDER` (`local` or `neon`), `SESSION_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `MAILERSEND_API_KEY`
  - [ ] 1.8 Create `.env.example` with all required environment variable keys (no values)
  - [ ] 1.9 Create `.env.local` with local dev defaults: `DATABASE_URL=postgres://localhost:5432/new_human_dev`, `DATABASE_PROVIDER=local`, `SESSION_SECRET=dev-secret-change-me`

- [ ] 1.5 Local Development Database Setup
  - [ ] 1.5.1 Install Postgres locally via Homebrew: `brew install postgresql@16`, then `brew services start postgresql@16`
  - [ ] 1.5.2 Create the local development database: `createdb new_human_dev`
  - [ ] 1.5.3 Install the `pg` package for local Postgres connectivity: `pnpm add pg` and `pnpm add -D @types/pg`
  - [ ] 1.5.4 Create the local setup SQL script (`scripts/setup-local-db.sql`) that creates all giving-platform shared tables locally (`users`, `sessions`, `tokens`, `rate_limit_attempts`, `user_settings`) using the exact production schema — these are only created locally, never in production where they already exist
  - [ ] 1.5.5 Run the local setup script: `psql new_human_dev < scripts/setup-local-db.sql`
  - [ ] 1.5.6 Create the dev seed script (`src/db/seed-dev.ts`) that inserts test users (one `user` role, one `admin` role), test sessions, so you can log in locally without needing MailerSend or real OTP flow
  - [ ] 1.5.7 Add npm scripts to `package.json`: `"db:setup-local": "psql new_human_dev < scripts/setup-local-db.sql"`, `"db:seed-dev": "tsx src/db/seed-dev.ts"`, `"db:reset-local": "dropdb new_human_dev && createdb new_human_dev && pnpm db:setup-local && pnpm db:seed-dev"`

- [ ] 2.0 Database Schema & Migrations
  - [ ] 2.1 Set up Drizzle ORM configuration (`drizzle.config.ts`) pointing to `DATABASE_URL` (works for both local Postgres and production PlanetScale). Configure `snake_case` casing strategy (snake_case in DB, camelCase in TypeScript)
  - [ ] 2.2 Set up the database client (`src/db/index.ts`) with **environment-aware connection**: when `DATABASE_PROVIDER=local`, use the `pg` driver (`drizzle-orm/node-postgres`); when `DATABASE_PROVIDER=neon`, use `drizzle-orm/neon-http` (HTTP) and `drizzle-orm/neon-serverless` (WebSocket) for production
  - [ ] 2.3 Define Drizzle schema references (`src/db/shared-schema.ts`) for the **shared** tables from giving-platform: `users` (serial INTEGER PK, email, email_verified_at, first_name, last_name, role enum `'user'|'admin'|'su'`, status enum `'guest'|'active'|'suspended'|'deleted'`, journey), `sessions`, `tokens`, `rate_limit_attempts` — in production these tables already exist (DO NOT create them), locally they are created by `scripts/setup-local-db.sql`
  - [ ] 2.4 Write the `ALTER TABLE users` migration to add formation-specific columns: `display_name` (text), `search_handle` (text, unique), `avatar_url` (text), `church_id` (UUID, reserved for Phase 2+), `onboarded_at` (timestamptz), `push_subscription` (JSONB), `notification_prefs` (JSONB with defaults `{"daily_reminder": true, "reminder_time": "08:00", "friend_requests": true}`), `privacy_public` (boolean, default true)
  - [ ] 2.5 Create Drizzle schema for `block_day_tasks` table with columns: `id` (UUID PK), `block_number` (integer, 1-15), `day_number` (integer, 1-25), `category` (text: Physical/Mental/Emotional), `task_type` (text), `name` (text), `content` (JSONB), `display_order` (integer), `created_at` (timestamptz), `updated_at` (timestamptz)
  - [ ] 2.6 Create Drizzle schema for `task_completions` table with columns: `id` (UUID PK), `user_id` (**INTEGER** FK → users.id ON DELETE CASCADE), `task_id` (UUID FK → block_day_tasks.id ON DELETE CASCADE), `data` (JSONB), `completed_at` (timestamptz), unique constraint on `(user_id, task_id)`
  - [ ] 2.7 Create Drizzle schema for `member_block_completions` table with columns: `id` (UUID PK), `user_id` (**INTEGER** FK → users.id ON DELETE CASCADE), `block_number` (integer, default 1), `completed_at` (timestamptz), unique constraint on `(user_id, block_number)`
  - [ ] 2.8 Create Drizzle schema for `badge_definitions` table with columns: `id` (UUID PK), `name` (text), `description` (text), `icon_url` (text), `block_number` (integer, unique, 1-15), `is_milestone` (boolean), `created_at` (timestamptz)
  - [ ] 2.9 Create Drizzle schema for `member_badges` table with columns: `id` (UUID PK), `user_id` (**INTEGER** FK → users.id ON DELETE CASCADE), `badge_id` (UUID FK → badge_definitions.id), `earned_at` (timestamptz), unique constraint on `(user_id, badge_id)`
  - [ ] 2.10 Create Drizzle schema for `friend_requests` table with columns: `id` (UUID PK), `sender_id` (**INTEGER** FK → users.id ON DELETE CASCADE), `receiver_id` (**INTEGER** FK → users.id ON DELETE CASCADE), `status` (text: pending/accepted/rejected, default 'pending'), `created_at` (timestamptz), `updated_at` (timestamptz), unique constraint on `(sender_id, receiver_id)`
  - [ ] 2.11 Create Drizzle schema for `push_subscriptions` table with columns: `id` (UUID PK), `user_id` (**INTEGER** FK → users.id ON DELETE CASCADE, unique), `subscription` (JSONB), `created_at` (timestamptz)
  - [ ] 2.12 Create Drizzle schema for `notification_log` table with columns: `id` (UUID PK), `user_id` (**INTEGER** FK → users.id ON DELETE CASCADE), `type` (text: daily_reminder/friend_request), `title` (text), `body` (text), `sent_at` (timestamptz), `read_at` (timestamptz)
  - [ ] 2.13 Generate and run the Drizzle migration (`pnpm drizzle-kit generate` then `pnpm drizzle-kit migrate`)
  - [ ] 2.14 Create the seed script (`src/db/seed.ts`) that reads a CSV file and inserts Block 1 content into `block_day_tasks`, packing `_en`/`_zh` columns into locale-keyed JSONB (as described in PRD Req 96)
  - [ ] 2.15 Seed the `badge_definitions` table with the Block 1 badge: name "Block 1 Complete", description, `block_number: 1`, `is_milestone: true`

- [ ] 3.0 Authentication (Shared with Giving Platform)
  - [ ] 3.1 Study the giving-platform auth implementation at `cusxio/giving-platform` to understand the exact OTP flow, token hashing, session format, and cookie structure
  - [ ] 3.2 Implement the email input page (`/login`) — user enters email address, client calls the OTP request API
  - [ ] 3.3 Implement the OTP request API route (`POST /api/auth/otp/request`) — generate 6-digit OTP, hash with HMAC-SHA256, store in `tokens` table, send via MailerSend. Rate limit: 5 requests per 15-min window using `rate_limit_attempts`
  - [ ] 3.4 Implement the OTP verification page — user enters 6-digit code
  - [ ] 3.5 Implement the OTP verify API route (`POST /api/auth/otp/verify`) — compare hashed OTP, create session in `sessions` table, set `__session` cookie (`{sessionId}.{rawToken}`, HttpOnly, Secure, SameSite=Lax, 30-day expiry). Rate limit: 10 verify attempts per 5-min window
  - [ ] 3.6 Implement session validation middleware — read `__session` cookie, split `sessionId.rawToken`, hash rawToken with HMAC-SHA256, compare with stored hash, check expiry. Implement 7-day sliding renewal (extend expiry if session is within 7 days of expiring)
  - [ ] 3.7 Implement the logout API route (`POST /api/auth/logout`) — delete session row from `sessions`, clear `__session` cookie
  - [ ] 3.8 Implement auth guard — redirect unauthenticated users to `/login`, redirect authenticated users away from `/login`
  - [ ] 3.9 Support three user roles: `user`, `admin`, `su` (matching giving-platform's role enum — **NOT** `member`). Create a utility to check role from the session user. Admin role is manually assigned in DB. Also respect the user status lifecycle: `guest` → `active` → `suspended` / `deleted`
  - [ ] 3.10 Ensure cookie domain is set to `.yourdomain.com` for cross-subdomain sharing with giving-platform

- [ ] 4.0 Internationalisation (i18n) Setup
  - [ ] 4.1 Install and configure `next-intl` for client-side locale routing (no URL-based routing — locale from `localStorage`)
  - [ ] 4.2 Create `src/i18n/request.ts` — next-intl request configuration that reads locale from cookie
  - [ ] 4.3 Create `src/i18n/locale.ts` — custom hook `useLocale()` that reads/writes locale to `localStorage` (key: `locale`, values: `"en"` | `"zh"`) and a cookie (for server-side push notification text). Default to `"en"` if not set
  - [ ] 4.4 Create the English translation file `/messages/en.json` with all namespaces from the PRD (nav, dashboard, progress, mood, community, block, profile, auth, notifications, onboarding)
  - [ ] 4.5 Create the Chinese translation file `/messages/zh.json` mirroring the exact same key structure with translated values as specified in the PRD
  - [ ] 4.6 Wrap the root layout with `NextIntlClientProvider`, passing locale and messages from the client-side locale hook
  - [ ] 4.7 Implement the language toggle pill component for the header — shows inactive language label (e.g., "中文" when in English, "EN" when in Chinese); toggles `localStorage` + cookie + triggers re-render

- [ ] 5.0 Bottom Navigation & App Shell
  - [ ] 5.1 Create the **bottom navigation bar** component — 4 tabs: Home, Progress, Community, Profile. Frosted glass style with `backdrop-blur-xl`, rounded top corners (`3rem`). Active tab uses filled Material Symbol icon with brand red pill background
  - [ ] 5.2 Install/configure **Material Symbols** (outlined style, variable weight/fill) for nav icons and throughout the app
  - [ ] 5.3 Implement the app shell layout — bottom nav persists across all member-facing pages, header with profile photo + language toggle + settings icon

- [ ] 6.0 Onboarding Flow
  - [ ] 6.1 Create the Splash/Loading screen with app logo (page 1)
  - [ ] 6.2 Create the onboarding Welcome screen (page 4) — explain the 3 components (Mental, Emotional, Physical) and the 25-day block concept in plain, encouraging language. Include bilingual content via `next-intl`
  - [ ] 6.3 Implement the onboarding completion action — set `users.onboarded_at` to current timestamp (this starts the user on Block 1, Day 1), redirect to Dashboard
  - [ ] 6.4 Add a guard so that onboarded users skip the onboarding flow and go directly to Dashboard

- [ ] 7.0 Dashboard (Home Screen)
  - [ ] 7.1 Create the Dashboard page layout with the app header: profile photo (left), language toggle pill (right of photo), settings icon (right)
  - [ ] 7.2 Implement the **Scripture verse of the day** pull-quote component — fetch the current day's memory verse from `block_day_tasks` (Level 1, scripture_memorise), display in user's locale from JSONB content
  - [ ] 7.3 Implement the **Radar chart** (triangle chart) component showing Mental/Emotional/Physical engagement balance as percentages (0–100%) using the scoring formulas from PRD Req 37a: Mental = `SUM(xp_weight) / (days_elapsed × 3) × 100%`, Emotional = `COUNT(mood_logs) / days_elapsed × 100%`, Physical = `COUNT(exercise_ticks) / days_elapsed × 100%`
  - [ ] 7.4 Create the API route to compute radar chart data — query `task_completions` joined with `block_day_tasks` for the current block, calculate percentage per category, return the three axis values
  - [ ] 7.5 Implement the **25-day block grid** component — a 5×5 grid of coloured squares; darker = more categories completed that day, grey = not yet reached. Calculate from `task_completions` grouped by day
  - [ ] 7.6 Implement the **Streak indicator** component — fire emoji 🔥 + streak count. Create the streak calculation query: count consecutive days backwards from today with at least 1 completion (using the SQL from PRD Req 36). Return 0 if no completion today
  - [ ] 7.7 Implement the **Activity calendar** component — monthly view with colour-coded dots per day (Physical `#fff7e4` with border, Mental `#ee1c24`, Emotional `#679fff`). Tap a day to navigate to that day's completions (page 6 — Calendar Day View)
  - [ ] 7.8 Implement the **Recent activity feed** component — last 5–10 completions showing category colour indicator, task name, and date
  - [ ] 7.9 Implement the time range filter (Last 7 days / Last 30 days) to scope the activity calendar and recent logs
  - [ ] 7.10 Create the **Calendar Day View** page (page 6) — shows all completions for a tapped day

- [ ] 8.0 Progress Screen (Daily Task View)
  - [ ] 8.1 Create the Progress page layout with the **day selector carousel** — horizontal scrollable row of Day 1–25 circles, current day highlighted, past days show completion state
  - [ ] 8.2 Implement the current day calculation API: `current_day = MIN(days_elapsed + 1, 25)` where `days_elapsed = TODAY - users.onboarded_at`
  - [ ] 8.3 Build the **task renderer architecture** — read `task_type` from `block_day_tasks` for the selected day and dynamically render the matching component
  - [ ] 8.4 Implement the **Mental section** UI — coloured accent bar (red `#ee1c24`), two task items: Level 1 ("Memorise {reference}") and Level 2 ("Study {reference}"). Each has a completion indicator (empty circle → checkmark) and a chevron for navigation
  - [ ] 8.5 Implement the **Scripture Memorise renderer** (Level 1) — displays memory verse reference and text (in user's locale from JSONB), "Done" button to mark complete. Record completion in `task_completions`
  - [ ] 8.6 Implement the **Scripture Study renderer** (Level 2) — displays full Ephesians passage (in user's locale), explanation text (in user's locale), and embedded video (if URL exists). "Done" button to mark complete. Record completion in `task_completions`
  - [ ] 8.7 Implement the **Emotional section** UI — coloured accent bar (blue `#679fff`), "Mood Log" task item with completion indicator
  - [ ] 8.8 Implement the **Mood Log renderer** — 3-step flow: Step 1: emoji picker (😡 Terrible, ☹️ Bad, 😐 Okay, ☺️ Good, 😍 Excellent), Step 2: influence multi-select (Family, Friends, Love, Work, School, Health), Step 3: optional free-text. On submit, record in `task_completions` with data JSONB `{ mood, influences, context }`
  - [ ] 8.9 Implement the **Physical section** UI — coloured accent bar (warm cream/gold `#fff7e4` with visible border), "Exercise" task item
  - [ ] 8.10 Implement the **Exercise renderer** — simple tick-box "Did you exercise today?" Toggle marks Physical task complete in `task_completions`
  - [ ] 8.11 Implement the **task completion API** (`POST /api/tasks/complete`) — accepts `task_id` and optional `data` JSONB, inserts into `task_completions` with unique constraint handling (ignore duplicates). After insertion, check block completion (all 3 categories done at least once) and award badge if applicable
  - [ ] 8.12 Implement **past day viewing** — allow navigation to any day 1 through current_day in the carousel, showing that day's tasks and their completion states (read-only for completed tasks)
  - [ ] 8.13 Ensure each task's **completion indicator** updates in real-time after marking done (empty circle → checkmark)

- [ ] 9.0 Block Completion & Badge System
  - [ ] 9.1 Implement the block completion detection logic — on each task completion, check if user has at least 1 completion in each of the 3 categories (Mental, Emotional, Physical) for the current block. If yes and no existing `member_block_completions` row, insert one
  - [ ] 9.2 Implement the badge awarding logic — on block completion, insert into `member_badges` linking the user to the Block 1 badge definition
  - [ ] 9.3 Create the **Block Completion Celebration screen** (page 12, overlay) — "You've completed Block 1! 🎉" with the badge being awarded and a visual flourish animation
  - [ ] 9.4 Trigger the celebration screen on next client load after block completion (check for newly awarded badge on dashboard load)
  - [ ] 9.5 Handle the case where block ends without completion (Day 25 reached, not all 3 categories done) — display an encouraging message, no negative framing

- [ ] 10.0 Community Features
  - [ ] 10.1 Create the **Community tab page** (page 13) with bottom nav state, containing Friends/Add Friends toggle buttons at the top
  - [ ] 10.2 Implement the **Friends list** view (page 14) — display accepted friends with profile photo, display name, and their most recent activity
  - [ ] 10.3 Implement the **Add Friends** view (page 15) — search input for handle or display name, show results with "Add Friend" button. Create API route `POST /api/friends/request` to send a friend request (insert into `friend_requests` with status `pending`)
  - [ ] 10.4 Implement the **Friend Requests** view (page 16) — list incoming pending requests with Accept/Reject buttons. API routes: `POST /api/friends/accept` (update status to `accepted`), `POST /api/friends/reject` (update status to `rejected`)
  - [ ] 10.5 Implement the **People You May Know** horizontal carousel (page 13) — query mutual friend suggestions using the SQL from PRD (users with ≥1 mutual accepted friend, not already friends). Show avatar, name, mutual count, "Add Friend" button
  - [ ] 10.6 Implement the **Activity Feed** (page 13) — query accepted friends' recent completions (fan-out on read) where friend's `privacy_public = true`. Display: avatar, name, activity name, category colour tag, relative time
  - [ ] 10.7 Implement the search API (`GET /api/friends/search?q=`) — search by `search_handle` or `display_name` (case-insensitive partial match)

- [ ] 11.0 Push Notifications & Service Worker
  - [ ] 11.1 Create the service worker file (`public/sw.js`) — register for push events, handle notification display, handle notification click (open app)
  - [ ] 11.2 Implement service worker registration in the app — register on first successful login, request notification permission
  - [ ] 11.3 Implement the push subscription API (`POST /api/notifications/subscribe`) — store the Web Push subscription object in `push_subscriptions` table
  - [ ] 11.4 Implement the **daily reminder** push notification — server-side cron/scheduled function that queries users with `daily_reminder: true` in `notification_prefs`, sends push at their configured `reminder_time`. Message text in user's preferred locale (read from `locale` cookie stored value or default `en`)
  - [ ] 11.5 Implement the **friend request** push notification — triggered when a friend request is created, send push to receiver: "{Name} sent you a friend request" in receiver's preferred locale
  - [ ] 11.6 Implement **offline caching** via the service worker — cache dashboard, calendar, and recent activity data using Workbox cache strategies (stale-while-revalidate for API data, cache-first for static assets)
  - [ ] 11.7 Implement **offline completion queue** — when offline, store task completions in IndexedDB. Use Workbox Background Sync to replay queued requests on reconnect. Handle duplicate detection via unique constraint (silently ignore conflicts)
  - [ ] 11.8 Implement the "Add to Home Screen" prompt — trigger after first successful login using the `beforeinstallprompt` event

- [ ] 12.0 Profile Screen
  - [ ] 12.1 Create the **Profile page** (page 17) — display name, email, search handle (e.g., `@john.church`), avatar
  - [ ] 12.2 Implement the **Badge display** section — show the Block 1 badge if earned (icon, name, date earned). Structure as a grid for future Phase 2 expansion
  - [ ] 12.3 Implement the **Mood Log History** page (page 19) — chronological list of past mood entries (emoji, influences, context, date). Private — not visible to admin or friends
  - [ ] 12.4 Implement the **Settings page** (page 18) with: Language toggle (shows "English" / "中文", taps to switch — same as header toggle), Notification preferences (toggle daily reminders on/off, toggle friend request notifications on/off, set reminder time picker), Privacy toggle (control whether completions are visible to friends — updates `users.privacy_public`)
  - [ ] 12.5 Implement the **Log Out** button — calls `POST /api/auth/logout`, clears session, redirects to login

- [ ] 13.0 Admin — Content Management
  - [ ] 13.1 Create the **Admin Daily Content Manager** page (page 20) — accessible only to users with `admin` or `su` role. Redirect non-admins
  - [ ] 13.2 Implement the day-by-day content editor — list all 25 days, each expandable to show Mental Level 1 and Level 2 fields
  - [ ] 13.3 Implement **side-by-side or tabbed EN/ZH input** for each translatable field: memory verse text (EN + ZH), scripture passage text (EN + ZH), explanation text (EN + ZH), video URL (single shared field)
  - [ ] 13.4 Implement the content save API (`PUT /api/admin/tasks/:taskId`) — update `block_day_tasks.content` JSONB with the bilingual content, set `updated_at`. Validate admin role
  - [ ] 13.5 Implement content fallback logic — if user's preferred locale is missing in JSONB content, fall back to: requested locale → `en` → first available locale
  - [ ] 13.6 Verify that content changes go live immediately without code deployment (since content is DB-driven)

- [ ] 14.0 Testing & Quality Assurance
  - [ ] 14.1 Write unit tests for authentication flow: OTP request, OTP verify, session validation, session renewal, logout, rate limiting
  - [ ] 14.2 Write unit tests for block system: day calculation, block completion detection, edge cases (Day 25, no activities, partial completion)
  - [ ] 14.3 Write unit tests for streak calculation: consecutive days, streak break, no activity today returns 0, single day streak
  - [ ] 14.4 Write unit tests for radar chart scoring: percentage calculations for each axis, edge cases (Day 1, no completions, all completions)
  - [ ] 14.5 Write unit tests for task completion: unique constraint handling, mood log data storage, block completion + badge trigger
  - [ ] 14.6 Write unit tests for community: friend request lifecycle (send → accept/reject), mutual friend suggestions, activity feed query, privacy toggle
  - [ ] 14.7 Write unit tests for i18n: locale toggle, content fallback logic, next-intl message resolution
  - [ ] 14.8 Write unit tests for admin content management: CRUD operations, bilingual JSONB packing, role authorization
  - [ ] 14.9 Test PWA features: manifest validation, service worker registration, offline caching, background sync
  - [ ] 14.10 Performance testing: verify app loads under 3 seconds on mobile (standard connection) per success metrics
  - [ ] 14.11 Cross-browser testing: Chrome, Safari (desktop + mobile), Firefox. Verify Chinese font rendering

- [ ] 15.0 Deployment & Launch
  - [ ] 15.1 Configure Vercel deployment — connect repository, set environment variables (DATABASE_URL, SESSION_SECRET, VAPID keys, MAILERSEND_API_KEY)
  - [ ] 15.2 Configure the deployment domain as a sibling subdomain of the giving platform (e.g., `formation.church.com`) and set cookie domain to `.church.com`
  - [ ] 15.3 Run the content seed script against the production database (Block 1, 25 days of bilingual Ephesians content)
  - [ ] 15.4 Seed the Block 1 badge definition in production
  - [ ] 15.5 Verify shared authentication works end-to-end: log in on giving platform, confirm session is valid on formation app (and vice versa)
  - [ ] 15.6 Verify push notifications work on Android Chrome and desktop browsers. Document iOS Safari limitations if applicable (Pending Decision #19)
  - [ ] 15.7 Final smoke test of all screens (1–20) with both EN and ZH locales
  - [ ] 15.8 Coordinate with giving-platform team on shared `users` table column additions (Pending Decision #20)
