# PRD: The New Human Project

**Document Status:** Draft v2.4
**Target Timeline:** MVP in 6–8 weeks
**Primary Audience:** Junior Developer
**Package Manager:** pnpm

---

## 1. Introduction / Overview

Many people desire spiritual growth but lack a practical, non-overwhelming way to begin. **The New Human Project** is a Progressive Web App (PWA) that guides users — especially newer believers — through a structured spiritual formation journey across three holistic dimensions: **Mental Capacity**, **Emotional Health**, and **Physical Well-Being**.

Phase 1 focuses on a **single 25-day block** — the first block of what will eventually be a 15-block programme (~1 year). Each day within the block has admin-curated content across the three categories. Users engage with Scripture study (Mental), log their mood (Emotional), and check off exercise (Physical). The app also provides a community experience with friends and an activity feed.

The app targets church members who don't know where to start in becoming more like Jesus. It meets them where they are — guiding them gently rather than overwhelming them with expectations.

---

## 2. Goals

1. Guide newer believers through a structured 25-day formation block across Physical, Mental, and Emotional categories.
2. Provide daily admin-curated content: Scripture study with explanations/videos (Mental), mood logging (Emotional), and exercise tracking (Physical).
3. Provide a community experience — friends, activity feed, friend suggestions — to encourage accountability and shared growth.
4. Award a virtual badge on block completion to celebrate the milestone.
5. Deliver push notifications for daily reminders and friend requests via service workers.
6. Provide a visual dashboard with activity calendar, streak indicator, and recent logs.
7. Implement streak tracking — completing at least 1 activity per day maintains the streak.
8. Share authentication with the church's existing giving platform (same user accounts, same email OTP flow).
9. Build the foundation so Phase 2 (multiple blocks, activity library, assessment wheel, badges collection) and Phase 3 (buddy system, deeper community) can be added without major rewrites.
10. Deliver a working MVP within 6–8 weeks.

---

## 3. Programme Structure (Developer Context)

| Concept | Detail |
|---|---|
| **Block** | A 25-day period of formation activity |
| **Phase 1 scope** | **Block 1 only** (25 days) |
| **Future blocks** | Up to 15 blocks (375 days) — Phase 2+ |
| **Components** | 3 per day: Mental Capacity, Emotional Health, Physical Well-Being |
| **Mental** | Scripture study through the book of Ephesians — **two levels per day**: Level 1 (memorise the verse) and Level 2 (read the explanation + read a chunk of Ephesians). Level 2 carries more weight on the radar chart. |
| **Emotional** | Daily mood log — emoji rating, mood influences, free-text context |
| **Physical** | Simple exercise tick-box — did you exercise today? (honour system) |
| **Block completion** | User has engaged with all 3 categories at least once within the 25-day block |
| **Virtual badge** | Awarded on block completion |
| **Open to** | Anyone — not restricted to church members |

---

## 4. User Stories

**As a new believer:**
- I want to see which day I'm on in the 25-day block so I know where I am in the journey.
- I want to see today's content grouped by Mental, Emotional, and Physical so I know what to do.
- I want to read the assigned Ephesians passage and watch an explanation video for today's Mental task.
- I want to log my mood with an emoji, select what's influencing it, and write some context for today's Emotional task.
- I want to tick a box to confirm I exercised today for my Physical task.
- I want a colour-coded calendar showing which days I was active and in which category.
- I want a streak counter that grows each day I complete at least 1 activity.
- I want to receive a daily push notification reminding me to complete my tasks.
- I want to earn a virtual badge when I complete the 25-day block.
- I want to log in with the same email OTP I use for the church giving platform.

**As a community member:**
- I want to see my friends' recent activity so we can encourage each other.
- I want to add friends by searching their handle or name.
- I want to see "people you may know" suggestions based on mutual friends.
- I want to receive a push notification when someone sends me a friend request.

**As a Chinese-speaking member:**
- I want to toggle the app language to Chinese (中文) so I can navigate and read content in my preferred language.
- I want my language preference to persist so I don't have to switch every time I open the app.
- I want Scripture passages, explanations, and all UI text available in Chinese.

**As a church admin/leader:**
- I want to assign the daily Mental content (Ephesians passages, explanations, videos) for each of the 25 days in both English and Chinese.
- I want to manage content without a code deployment.

---

## 5. Functional Requirements

### 5.1 Authentication (Shared with Giving Platform)

1. The system must use the **same authentication system** as the church giving platform ([cusxio/giving-platform](https://github.com/cusxio/giving-platform)): custom email OTP (6-digit code), no passwords, no social login.
2. Both apps must share the same **users**, **sessions**, **tokens**, and **rate_limit_attempts** database tables on the same **PlanetScale** (Postgres-compatible) instance, connected via the **`@neondatabase/serverless`** driver.
3. Both apps must use the same `SESSION_SECRET` for HMAC-SHA256 token hashing.
4. Session cookie (`__session`) format must match: `{sessionId}.{rawToken}`, HttpOnly, Secure, SameSite=Lax, 30-day expiry with 7-day sliding renewal.
5. Both apps should be deployed on the same parent domain (e.g., `giving.church.com` and `formation.church.com`) so cookies can be shared via `Domain=.church.com`.
6. The system must support three user roles: `user`, `admin`, and `su` (matching the giving platform's `role` enum). The giving platform uses `'user'` — not `'member'` — as the default role. Admin role is manually assigned.
7. The system must allow users to log out (deletes session row, clears cookie).
8. Rate limiting must match the giving platform: 5 OTP requests per 15-min window, 10 OTP verify attempts per 5-min window.

### 5.2 Onboarding

9. On first login, the system must guide the user through a brief onboarding flow (under 5 minutes).
10. The onboarding must explain the three components (Mental, Emotional, Physical) and the 25-day block concept in plain language.
11. After onboarding, the member is placed into Block 1, Day 1 and taken to the dashboard.
12. All users follow the same predefined content — there is no activity selection during onboarding.

### 5.3 25-Day Block System (Phase 1: Block 1 Only)

13. The system must track each member's current day within Block 1 (1–25), calculated from `users.onboarded_at`.
14. A block is **complete** when the member has engaged with all 3 categories (Mental, Emotional, Physical) at least once within the 25-day window.
15. On block completion, the system must display a **celebration screen** and award a **virtual badge**.
16. If a member does not complete the block within 25 days, the block ends — no penalty, no negative framing. The system displays an encouraging message.
17. The block calculation logic:
    ```
    days_elapsed = TODAY - users.onboarded_at
    current_day  = MIN(days_elapsed + 1, 25)
    ```

### 5.4 Daily Content — Mental (Scripture Study)

18. The Mental component for Phase 1 covers the **book of Ephesians** across 25 days.
19. Each day's Mental content has **two levels** of engagement:
    - **Level 1 — Memorise the Verse**: The user is shown a key verse from today's Ephesians passage and is asked to memorise it. Marking it done completes Level 1. This is the minimum Mental engagement for the day.
    - **Level 2 — Read & Study**: The user reads the full Ephesians passage for today, reads the explanation text, and/or watches the explanation video. Marking it done completes Level 2. This represents deeper engagement.
20. Level 1 and Level 2 are **separate tasks** in the database (`block_day_tasks`), both under the `Mental` category. The user can complete Level 1 only, or both. Level 2 is not required for block completion — but it contributes more to the radar chart score (see Req 37a).
21. The daily Mental content structure per day:
    - **Level 1 task** (`task_type: 'scripture_memorise'`):
      - `memory_verse_reference` — e.g., "Ephesians 1:3"
      - `memory_verse_text` — the specific verse to memorise
      - `xp_weight` — `1` (used for radar chart scoring)
    - **Level 2 task** (`task_type: 'scripture_study'`):
      - `scripture_reference` — e.g., "Ephesians 1:1-14"
      - `scripture_text` — the full passage text
      - `explanation` — optional text explanation
      - `video_url` — optional embedded video URL
      - `xp_weight` — `2` (used for radar chart scoring)
22. When the user opens a day's Mental section on the Progress screen:
    - They see **two task items**: "Memorise Ephesians 1:3" (Level 1) and "Study Ephesians 1:1-14" (Level 2)
    - Tapping Level 1 shows the memory verse with a "Done" button
    - Tapping Level 2 shows the full passage, explanation, and video with a "Done" button
    - Each task has its own completion indicator (empty circle → checkmark)
23. Mental task completions are recorded with timestamps in the database — one row per level completed.

### 5.5 Daily Content — Emotional (Mood Log)

24. The Emotional component is a **daily mood log**. Expressing and naming emotions is a core part of emotional regulation.
25. The mood log flow has three steps:
    - **Step 1 — Pick an emoji** that represents their mood:
      - 😡 Terrible
      - ☹️ Bad
      - 😐 Okay
      - ☺️ Good
      - 😍 Excellent
    - **Step 2 — What is influencing your mood?** (multi-select from predefined tags):
      - Family, Friends, Love, Work, School, Health
    - **Step 3 — More context** (optional free-text input):
      - An input field for them to describe their mood in their own words
26. Submitting the mood log marks the Emotional task as complete for that day.
27. Past mood logs are viewable by the member (private — not visible to admin or friends).

### 5.6 Daily Content — Physical (Exercise Check-In)

28. The Physical component is a **simple exercise tick-box**.
29. The user sees a checkbox or button: "Did you exercise today?"
30. Tapping it marks the Physical task as complete for that day. There is no requirement to specify what exercise was done — this is based on the honour system.
31. Physical task completion is recorded with a timestamp.

### 5.7 Streak System

32. The system must track a **daily streak** for each member.
33. A streak increments by 1 for each consecutive day the member completes **at least 1 activity** (Mental, Emotional, or Physical).
34. If the member does not complete any activity for an entire calendar day, the streak **resets to 0**.
35. The streak counter must be displayed prominently on the dashboard (e.g., "🔥 12" with a fire icon, as shown in the wireframe).
36. Streak is calculated from the database — count consecutive days backwards from today where at least 1 completion exists.

### 5.8 Dashboard (Home Screen)

37. The dashboard must contain:
    - **Scripture verse of the day** — from the current day's Ephesians passage (displayed as a pull-quote at the top)
    - **Radar chart** — triangle chart showing the member's engagement balance across Mental, Emotional, and Physical within the **current block** (see Req 37a–37f for scoring details)
    - **25-day block grid** — a 5×5 grid of coloured squares showing which days have been completed (darker = more categories completed that day, grey = not yet reached)
    - **Streak indicator** — fire icon with streak count (Req 35)
    - **Activity calendar** — monthly view with colour-coded dots per day (Physical `#fff7e4` with border, Mental `#ee1c24`, Emotional `#679fff`). Tap a day to see what was completed.
    - **Recent activity feed** — last 5–10 completions with category colour, name, and date

#### 5.8.1 Radar Chart — Scoring & Behaviour

> **Design rationale:** The radar chart uses **percentage-based scoring (0–100%)** per axis, normalised against days elapsed so far in the block. This follows the industry standard approach (Hevy, Garmin, balanced scorecards) where radar charts show relative balance, not raw counts. Each axis uses the same 0–100% scale so the triangle shape reflects engagement *balance* across the three dimensions.

37a. Each axis is scored as a **percentage (0–100%)** representing engagement relative to maximum possible for the days elapsed so far in the current block:

| Axis | Formula | Max per day |
|---|---|---|
| **Mental** | `SUM(xp_weight of completed mental tasks) / (days_elapsed × 3) × 100%` | 3 XP (Level 1 = 1, Level 2 = 2) |
| **Emotional** | `COUNT(mood logs completed) / days_elapsed × 100%` | 1 (one mood log per day) |
| **Physical** | `COUNT(exercise ticks completed) / days_elapsed × 100%` | 1 (one exercise tick per day) |

37b. **Example:** On Day 10, a member who completed Mental Level 1 on 5 days and Level 1+2 on 3 days, mood logged 8 days, and exercised 6 days would see: Mental = `(5×1 + 3×3) / (10×3) = 46.7%`, Emotional = `8/10 = 80%`, Physical = `6/10 = 60%`.

37c. The radar chart **resets to 0% on all axes when a new block begins**. Each block is its own "season" of engagement — the chart measures current balance, not lifetime achievement. This prevents the chart from becoming permanently maxed out after Block 1 (the "ceiling problem").

37d. **Ghost overlay (Phase 2):** In Phase 2, when multiple blocks exist, the previous block's final radar shape is shown as a faint grey triangle behind the current block's active triangle. This lets users compare their engagement balance block-over-block (similar to Hevy's period comparison where current period is blue and previous period is grey).

37e. **Lifetime progress is shown elsewhere**, not on the radar chart:
  - **Badge collection** — one badge per completed block (already in Req 60–64)
  - **Streak counter** — persists across blocks, only resets on missed days (already in Req 32–36)
  - **Block completion history** — stored in `member_block_completions` table

37f. The radar chart is **computed on read** from `task_completions` joined with `block_day_tasks`, not stored. The query filters by the user's current `block_number` and calculates the percentage for each category.

38. Dashboard time range filters: Last 7 days, Last 30 days.

### 5.9 Progress Screen (Daily Task View)

39. The Progress screen shows the **current day's tasks** grouped by category: Mental → Emotional → Physical.
40. Each category section has a coloured accent bar (Mental = red, Emotional = blue, Physical = warm cream/gold).
41. **Mental section**: Shows two task items for today — Level 1 ("Memorise Ephesians 1:3") and Level 2 ("Study Ephesians 1:1-14"). Tapping a task item navigates to the content. A chevron indicates tappable items. Each level has its own completion indicator.
42. **Emotional section**: Shows "Mood Log" as the task. Tapping opens the mood log flow (Req 25).
43. **Physical section**: Shows "Exercise" as the task. Tapping toggles the tick-box.
44. Users must be able to **view past days** within the 25-day block to see what they completed.
45. Each task shows a **completion indicator** (empty circle when incomplete, checkmark when done).
46. The day selector carousel (horizontal scroll of Day 1–25 circles) allows navigation between days, as shown in the wireframe.

### 5.10 Community

47. The system must provide a **Community** tab in the bottom navigation.
48. **Friends list**: view accepted friends with their profile photo, name, and recent activity.
49. **Add friends**: search by handle or display name. Send a friend request (bidirectional — both must consent).
50. **Friend requests**: accept or reject incoming requests.
51. **People you may know**: horizontal scroll of suggested users based on mutual friends.
52. **Activity feed**: show friends' recent public completions (what they completed and when). Feed is assembled on read by querying accepted friends' recent completions.
53. Each activity card shows: friend's avatar, name, activity completed, category tag with colour, and relative time (as shown in the wireframe).
54. Members can control which of their completions are visible to friends via a privacy toggle in Profile settings.

### 5.11 Push Notifications (Service Workers)

55. The app must register a **service worker** for push notification support.
56. The system must send push notifications for:
    - **Daily reminder** — configurable time, reminds user to complete today's tasks ("Time for your daily formation! 🌱")
    - **Friend request received** — "[Name] sent you a friend request"
57. Users must be able to configure notification preferences in Profile/Settings (toggle each type on/off, set daily reminder time).
58. Push notifications must use the **Web Push API** via the **web-push** npm library.
59. The service worker must also handle **offline caching** of the dashboard and recent activity data.

### 5.12 Virtual Badge (Block 1)

60. The system must award a **virtual badge** when the member completes Block 1.
61. The badge has: a name ("Block 1 Complete"), an icon/image, a description, and the date earned.
62. The badge is displayed on the member's **Profile** screen.
63. The block completion celebration screen (Req 15) must show the badge being awarded with a visual flourish.
64. The database must support multiple badges for future blocks (Phase 2).

### 5.13 Admin — Content Management

65. Admin must be able to manage the **daily Mental content** for all 25 days:
    - Assign/edit the **Level 1** memory verse reference and text per day
    - Assign/edit the **Level 2** Scripture reference and full passage text per day
    - Add/edit optional explanation text per day (Level 2)
    - Add/edit optional video URL per day (Level 2)
66. Content management should be accessible via an **Admin Dashboard** in the app.
67. Changes must go live without a code deployment.

### 5.14 Profile

68. Profile screen must show: display name, email, search handle (e.g., `@john.church`), avatar.
69. **Badge display** — shows the Block 1 badge if earned (expandable to a collection grid in Phase 2).
70. **Mood log history** — viewable past mood entries (private).
71. **Notification preferences** — toggle daily reminders and friend request notifications; set reminder time.
72. **Privacy toggle** — control whether completions are visible to friends.
73. **Language preference** — shows current language ("English" / "中文") with a toggle to switch (see Req 102).
73a. Log out button.

### 5.15 Internationalisation (i18n) — English / Chinese

> **Design rationale:** The church community is bilingual (English/Chinese). The app must support both languages from day one. The industry-standard approach for Next.js i18n is **`next-intl`** — a mature, App Router–native library that handles message loading, locale routing, and React Server Component support. Content translations (Scripture, explanations) live in the database; UI string translations live in JSON message files.

#### Language Toggle

79. The app must support **two languages**: English (`en`) and Chinese (`zh`).
80. A **language toggle button** must appear in the **top app bar** (header), positioned to the right of the profile photo. The button displays the **inactive language** label as a compact pill (e.g., when in English mode, show "中文"; when in Chinese mode, show "EN") so that tapping it switches to the other language.
81. The toggle must switch the **entire UI** immediately — all labels, navigation, headings, button text, system messages, and dynamic content.
82. The user's language preference must be persisted in **`localStorage`** under the key `locale` (value: `"en"` or `"zh"`).
83. On app load, the system reads `localStorage.locale`. If not set, default to `en`.
84. The language preference is **client-side only** — it does not require a database column or server round-trip to switch. This keeps the toggle instant.

#### UI String Translations (`next-intl`)

85. The app must use **`next-intl`** for all static UI string translations (navigation labels, button text, headings, system messages, onboarding copy, mood emoji labels, influence tags, notification text, etc.).
86. Translation message files must be organised per locale:
    ```
    /messages
      /en.json        ← English strings
      /zh.json        ← Chinese strings
    ```
87. Message files must use **nested namespaces** matching feature areas:
    ```json
    {
      "nav": {
        "home": "Home",
        "progress": "Progress",
        "community": "Community",
        "profile": "Profile"
      },
      "dashboard": {
        "verseOfDay": "Verse of the Day",
        "streakLabel": "Day Streak",
        "activityCalendar": "Activity Calendar",
        "recentLogs": "Recent Logs",
        "last7Days": "Last 7 days",
        "last30Days": "Last 30 days"
      },
      "progress": {
        "dayLabel": "Day {day}",
        "mental": "Mental Capacity",
        "emotional": "Emotional Health",
        "physical": "Physical Well-Being",
        "memorise": "Memorise {reference}",
        "study": "Study {reference}",
        "moodLog": "Mood Log",
        "exercise": "Exercise",
        "done": "Done",
        "completed": "Completed"
      },
      "mood": {
        "pickEmoji": "How are you feeling today?",
        "terrible": "Terrible",
        "bad": "Bad",
        "okay": "Okay",
        "good": "Good",
        "excellent": "Excellent",
        "influences": "What is influencing your mood?",
        "family": "Family",
        "friends": "Friends",
        "love": "Love",
        "work": "Work",
        "school": "School",
        "health": "Health",
        "moreContext": "More context (optional)",
        "submit": "Submit"
      },
      "community": {
        "friends": "Friends",
        "addFriends": "Add friends",
        "peopleYouMayKnow": "People you may know",
        "addFriend": "Add friend",
        "mutualFriend": "{count} Mutual Friend",
        "completed": "completed",
        "sentFriendRequest": "sent you a friend request",
        "accept": "Accept",
        "reject": "Reject"
      },
      "block": {
        "theFoundation": "The Foundation",
        "the25DayBlock": "The 25-Day Block",
        "startJourney": "Start Journey",
        "blockComplete": "You've completed Block {block}! 🎉",
        "encourageMessage": "Great effort! Every step counts on your journey."
      },
      "profile": {
        "badges": "Badges",
        "moodHistory": "Mood History",
        "notifications": "Notifications",
        "privacy": "Privacy",
        "language": "Language",
        "logOut": "Log Out"
      },
      "auth": {
        "enterEmail": "Enter your email",
        "sendCode": "Send Code",
        "enterOTP": "Enter the 6-digit code",
        "verify": "Verify"
      },
      "notifications": {
        "dailyReminder": "Time for your daily formation! 🌱",
        "friendRequest": "{name} sent you a friend request"
      },
      "onboarding": {
        "welcome": "Welcome to The New Human Project",
        "mentalExplain": "Grow your mind through Scripture study",
        "emotionalExplain": "Build emotional awareness through daily reflection",
        "physicalExplain": "Care for your body with simple daily movement",
        "blockExplain": "Your journey starts with a 25-day block — small steps, big transformation.",
        "getStarted": "Get Started"
      }
    }
    ```
88. The Chinese `zh.json` file must mirror the exact same key structure with translated values. Example:
    ```json
    {
      "nav": {
        "home": "首页",
        "progress": "进度",
        "community": "社区",
        "profile": "个人"
      },
      "mood": {
        "pickEmoji": "你今天感觉怎么样？",
        "terrible": "很差",
        "bad": "不好",
        "okay": "还行",
        "good": "不错",
        "excellent": "非常好",
        "influences": "什么在影响你的心情？",
        "family": "家庭",
        "friends": "朋友",
        "love": "爱情",
        "work": "工作",
        "school": "学校",
        "health": "健康",
        "moreContext": "更多描述（可选）",
        "submit": "提交"
      }
    }
    ```

#### Content Translations (Database — Scripture, Explanations)

89. Admin-curated content in `block_day_tasks.content` (Scripture text, memory verses, explanations) must be stored in **both languages** using locale-keyed nested objects inside the existing JSONB column. The structure nests translatable text fields under `"en"` and `"zh"` keys:
    ```json
    // task_type: 'scripture_memorise'
    {
      "memory_verse_reference": "Ephesians 1:3",
      "memory_verse_text": {
        "en": "Praise be to the God and Father of our Lord Jesus Christ...",
        "zh": "愿颂赞归与我们主耶稣基督的父神…"
      },
      "xp_weight": 1
    }

    // task_type: 'scripture_study'
    {
      "scripture_reference": "Ephesians 1:1-14",
      "scripture_text": {
        "en": "Paul, an apostle of Christ Jesus...",
        "zh": "奉神旨意，作基督耶稣使徒的保罗…"
      },
      "explanation": {
        "en": "This opening section introduces...",
        "zh": "这段开篇介绍了…"
      },
      "video_url": "https://youtube.com/watch?v=...",
      "xp_weight": 2
    }
    ```
90. **Non-translatable fields** (`memory_verse_reference`, `scripture_reference`, `video_url`, `xp_weight`, mood options, influence options) remain as flat values — they are the same in both languages or are already handled by UI string translations.
91. The `name` column on `block_day_tasks` stores the **English name** as a key identifier. The display name shown to users is resolved via `next-intl` message keys (e.g., `progress.memorise` with the reference interpolated), not from the `name` column directly.
92. The frontend reads the current locale from `localStorage` and extracts the matching language value from the JSONB content: `content.scripture_text[locale]`.

#### Admin Content Management — Bilingual

93. The Admin Daily Content Manager (page 20) must show **side-by-side or tabbed input fields** for English and Chinese content per day:
    - Memory verse text: EN field + ZH field
    - Scripture passage text: EN field + ZH field
    - Explanation text: EN field + ZH field
    - Video URL: single field (shared — videos may be language-specific; admin enters one URL)
94. Admin can save content with only one language filled in — the system falls back to the available language if the user's preferred locale is missing. Fallback order: requested locale → `en` → first available.

#### Content Seeding — Bilingual Columns

95. The Google Sheet for content seeding must include bilingual columns:

    | block | day | order | category | task_type | name | memory_verse_ref | memory_verse_text_en | memory_verse_text_zh | scripture_reference | scripture_text_en | scripture_text_zh | explanation_en | explanation_zh | video_url | xp_weight |
    |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
    | 1 | 1 | 1 | Mental | scripture_memorise | Memorise Ephesians 1:3 | Ephesians 1:3 | Praise be to the God... | 愿颂赞归与我们主耶稣基督的父神… | | | | | | | 1 |
    | 1 | 1 | 2 | Mental | scripture_study | Study Ephesians 1:1-14 | | | | Ephesians 1:1-14 | Paul, an apostle... | 奉神旨意… | This opening... | 这段开篇… | https://youtube.com/... | 2 |

96. The seed script must pack the `_en` and `_zh` columns into the locale-keyed JSONB structure when inserting into `block_day_tasks.content`.

#### Typography — Chinese Font Support

97. The design system must include **Chinese-appropriate font fallbacks**. Plus Jakarta Sans and Manrope do not contain CJK glyphs. The Tailwind font stacks must be:
    ```
    headline: ['Plus Jakarta Sans', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif]
    body:     ['Manrope', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif]
    ```
    - **Noto Sans SC** (Google Fonts, free) provides full Simplified Chinese coverage and matches the clean, modern aesthetic of Plus Jakarta Sans and Manrope.
    - **PingFang SC** is the system font on Apple devices (macOS/iOS) — no download required.
    - **Microsoft YaHei** is the system font on Windows — no download required.
    - Load Noto Sans SC from Google Fonts alongside the existing font imports, with `font-display: swap` to avoid blocking render.

#### `next-intl` Integration Architecture

98. The i18n implementation must follow the **`next-intl` client-side locale** pattern (no URL-based locale routing like `/en/dashboard` or `/zh/dashboard`). The locale is determined by `localStorage`, not the URL path. This avoids URL complexity and keeps the toggle instant.

99. Project structure for i18n:
    ```
    /src
      /i18n
        /messages
          en.json               ← English UI strings
          zh.json               ← Chinese UI strings
        request.ts              ← next-intl request configuration (reads locale from cookie/header)
      /features
        /...                    ← existing feature folders (unchanged)
    /messages                   ← alternative top-level location (next-intl default)
      en.json
      zh.json
    ```

100. The `next-intl` provider must wrap the app layout and receive the locale from a client-side hook that reads `localStorage`:
     ```tsx
     // Simplified flow:
     // 1. Client reads localStorage.getItem('locale') ?? 'en'
     // 2. Passes locale to NextIntlClientProvider
     // 3. All components use useTranslations('namespace') to get translated strings
     // 4. Language toggle updates localStorage and triggers re-render
     ```

101. Push notification text (Req 56) must be sent in the user's preferred language. Since `localStorage` is client-only, the user's locale preference must also be stored in a **cookie** (`locale`, value `"en"` or `"zh"`) so the server can read it when composing push notification payloads. The cookie is set alongside `localStorage` whenever the user toggles language.

#### Profile Settings — Language Preference

102. The **Profile** settings screen (page 18) must include a **Language** setting row that shows the current language (e.g., "English" or "中文") and taps to toggle. This provides an alternative to the header toggle for discoverability.

### 5.16 PWA Requirements

74. The app must be installable on mobile home screens (manifest.json with app name, icons, theme colour).
75. Mobile-first responsive design. Must work on desktop.
76. Offline read access for dashboard, calendar, and recent logs via service worker caching.
77. Completions made offline must be queued in IndexedDB and synced on reconnect (last-write-wins via `updated_at`).
78. "Add to Home Screen" prompt after first successful login.

---

## 6. Non-Goals (Out of Scope for Phase 1)

| Feature | Target Phase |
|---|---|
| Multiple blocks (Blocks 2–15) | Phase 2 |
| Block progress indicator (block X of 15) | Phase 2 |
| Predefined activity library (~100 activities with guides) | Phase 2 |
| Custom user-created activities | Phase 2 |
| Ad-hoc activity logging (outside daily tasks) | Phase 2 |
| Personal target frequency for activities | Phase 2 |
| Resource library (browsable guides) | Phase 2 |
| Spiritual Health Assessment (9-spoke wheel) | Phase 2 |
| Friend activity push notifications | Phase 2 |
| Physical badge purchasing | Phase 2 |
| Pop-up event announcements and registration | Phase 2 |
| Congregation aggregate assessment wheel | Phase 2 |
| Buddy system / member pairing | Phase 3 |
| Individual member progress visible to leaders | Phase 3 (with consent model) |
| Multi-church support | Future (schema ready via `church_id`) |
| Public-facing activity sharing outside app | Future |

---

## 7. Design Considerations

### Visual Language
- **Warm, human, and encouraging** — not clinical, gamified, or performance-pressured. Think: journal meets wellness app.
- Missed days carry **no negative framing**. Progress is celebrated, not penalised.
- Soft, earthy tones. Category colours are the primary accent system.

### Category Colour Coding (consistent across all views)

| Category | Colour | Hex | Note |
|---|---|---|---|
| Physical | Warm Cream / Gold | `#fff7e4` | Very light — always display with a visible border or on a contrasting bg. WCAG AA compliant. |
| Mental | Red | `#ee1c24` | Primary brand accent |
| Emotional | Sky Blue | `#679fff` | |

### Design System (from wireframes)
- **Fonts**: Plus Jakarta Sans (headlines), Manrope (body/labels). Chinese fallbacks: Noto Sans SC → PingFang SC → Microsoft YaHei (see Req 97).
- **Primary colour**: `#c10014` (brand red)
- **Secondary colour**: `#135db9` (blue)
- **Tertiary colour**: `#645f50` (earthy)
- **Surface palette**: Material Design 3 tonal surfaces (`#fef8f5` base)
- **Border radius**: `1rem` default, `2rem` large, `3rem` extra-large, `9999px` full
- **Bottom navigation**: 4 tabs — Home, Progress, Community, Profile. Frosted glass nav bar with `backdrop-blur-xl`, rounded top corners (`3rem`). Active tab uses filled icon with brand red pill background.
- **Cards**: White (`surface-container-lowest`) with soft shadow (`0 12px 32px rgba(53,50,47,0.06)`)
- **Material Symbols**: Outlined style, variable weight/fill

### Wireframe Reference

The Google Stitch wireframe code is located at:
```
/google-stitch.rtf
```

This file contains HTML/Tailwind mockups for the following screens that developers should reference during implementation:
1. **Dashboard** — radar chart, 25-day block grid, activity calendar, recent logs, bottom nav
2. **Community Feed** — friends/add friends buttons, people you may know carousel, activity feed cards
3. **Practice Detail (Video)** — "Memorise a Verse" page with embedded video, editorial text, mastery progress
4. **Practice Detail (Timer)** — "Be in Solitude with God" solitude timer with SVG ring, presets, controls
5. **Day View (Progress)** — day selector carousel, daily tasks grouped by Mental/Emotional/Physical with tick circles and chevrons

### Screens (Complete Page List)

#### Member-Facing

| # | Page | Nav State | Description |
|---|---|---|---|
| 1 | Splash / Loading | — | App launch screen with logo |
| 2 | Sign Up (email input) | — | Email entry to receive OTP |
| 3 | OTP Verification | — | 6-digit code entry |
| 4 | Onboarding — Welcome | — | Explains 3 components and 25-day block |
| 5 | **Dashboard (Home)** | Home ✦ | Scripture verse, radar chart, 25-day grid, streak, calendar, recent logs. Header: profile photo (left), language toggle pill (left of settings), settings icon (right). |
| 6 | Calendar Day View | Home | All completions for a tapped day |
| 7 | **Progress — Day View** | Progress ✦ | Day selector carousel + tasks by category |
| 8 | Progress — Past Day | Progress | View a previous day's tasks and completions |
| 9 | Mental — Scripture View | Progress | Ephesians passage + explanation + video for today |
| 10 | Emotional — Mood Log | Progress | Emoji picker → influence tags → free-text input |
| 11 | Physical — Exercise Tick | Progress | Simple "Did you exercise?" confirmation |
| 12 | Block Completion Celebration | — (overlay) | "You've completed Block 1! 🎉" + badge award |
| 13 | **Community — Feed** | Community ✦ | Friends/add buttons, people you may know, activity feed |
| 14 | Community — Friends List | Community | Accepted friends with recent activity |
| 15 | Community — Add Friends | Community | Search by handle/name |
| 16 | Community — Friend Requests | Community | Accept/reject incoming requests |
| 17 | **Profile** | Profile ✦ | Name, handle, avatar, badge, mood history, language, settings |
| 18 | Profile — Settings | Profile | Language toggle, notification preferences, reminder time, privacy toggle |
| 19 | Profile — Mood Log History | Profile | Past mood entries chronologically |

#### Admin-Facing

| # | Page | Description |
|---|---|---|
| 20 | Admin — Daily Content Manager | Manage Mental content for all 25 days in EN + ZH (scripture, explanation, video) |

---

## 8. Technical Considerations

### Tech Stack

| Concern | Technology | Rationale |
|---|---|---|
| **Frontend** | **Next.js 14+** (App Router) | Industry standard for React PWAs. SSR + API routes. |
| **Package Manager** | **pnpm** | Faster installs, strict dependency resolution. |
| **Database** | **PlanetScale** (Postgres-compatible) via **`@neondatabase/serverless`** driver | Shares the same DB instance as the giving platform for unified auth. The Neon driver is the connection client, not the hosting provider. |
| **ORM** | **Drizzle ORM** (with `snake_case` casing strategy) | Same ORM as the giving platform — shared schema definitions. Uses `drizzle-orm/neon-http` for HTTP and `drizzle-orm/neon-serverless` for WebSocket connections. |
| **Auth** | **Custom email OTP** (matching giving platform) | 6-digit OTP, HMAC-SHA256 hashed tokens, server-side sessions. Shared `users`, `sessions`, `tokens`, `rate_limit_attempts` tables. |
| **Push Notifications** | **Web Push API** + **web-push** npm | Service worker-based push notifications. |
| **i18n** | **`next-intl`** | App Router–native, supports RSC, client components, and message namespaces. Industry standard for Next.js i18n. |
| **Styling** | **Tailwind CSS** | Matches wireframe implementation. Material Design 3 colour tokens. |
| **CJK Fonts** | **Noto Sans SC** (Google Fonts) | Simplified Chinese fallback for Plus Jakarta Sans / Manrope. System fallbacks: PingFang SC (Apple), Microsoft YaHei (Windows). |
| **Offline** | **Service Worker** + **IndexedDB** | Workbox for caching; IndexedDB for offline completion queue. |
| **Deployment** | **Vercel** | Native Next.js support. |
| **Email** | **MailerSend** | Same provider as giving platform for OTP delivery. |

### Architecture (Modular Feature-Based)

```
/messages
  en.json                   ← English UI strings (next-intl)
  zh.json                   ← Chinese UI strings (next-intl)
/src
  /i18n
    request.ts              ← next-intl request config (reads locale from cookie)
    locale.ts               ← client-side locale hook (reads/writes localStorage + cookie)
  /features
    /auth                 ← Phase 1 (shared with giving-platform at DB level)
    /blocks               ← Phase 1 (25-day block system, Block 1 only)
    /tasks                ← Phase 1 (generic task renderer — reads task_type, renders appropriate UI)
      /renderers
        /scripture-memorise ← renders memory verse view (verse + "Done" button)
        /scripture-study    ← renders full study view (passage + explanation + video + "Done" button)
        /mood-log           ← renders emoji picker → influences → free-text
        /exercise           ← renders tick-box
        /reflective         ← Phase 2 (renders text prompt + input)
        /tick               ← Phase 2 (renders simple checkbox)
    /streaks              ← Phase 1 (streak calculation)
    /community            ← Phase 1 (friends, feed)
    /badges               ← Phase 1 (Block 1 badge)
    /notifications        ← Phase 1 (push via service worker)
    /admin                ← Phase 1 (content management)
    /tracker              ← Phase 2 (activity library, custom activities)
    /assessment           ← Phase 2 (9-spoke wheel)
    /resources            ← Phase 2 (resource library)
    /events               ← Phase 2
```

> **Task renderer pattern:** The Progress screen reads `task_type` from `block_day_tasks` and dynamically renders the matching component. Adding a new task type for Block 2 means: (1) add rows to `block_day_tasks`, (2) create a new renderer component. No schema changes, no refactoring.

### Shared Auth — Integration Strategy

The giving platform and The New Human Project share authentication at the **database level**:

```
┌────────────────────┐     ┌────────────────────┐
│  Giving Platform   │     │  New Human Project  │
│  (TanStack Start)  │     │  (Next.js)          │
└────────┬───────────┘     └────────┬────────────┘
         │                          │
         │   Same SESSION_SECRET    │
         │   Same cookie format     │
         │   Same domain (.church)  │
         │   @neondatabase/serverless driver
         └──────────┬───────────────┘
                    │
          ┌─────────▼──────────┐
          │  PlanetScale       │
          │  (Postgres-compat) │
          │  ┌───────────────┐ │
          │  │ users         │ │
          │  │ sessions      │ │
          │  │ tokens        │ │
          │  │ rate_limits   │ │
          │  │ ─ ─ ─ ─ ─ ─  │ │
          │  │ (formation    │ │
          │  │  tables below)│ │
          │  └───────────────┘ │
          └────────────────────┘
```

Both apps must:
1. Use the same `SESSION_SECRET` environment variable
2. Use the same cookie name (`__session`) and format (`{sessionId}.{rawToken}`)
3. Be deployed on sibling subdomains with cookie `Domain=.yourdomain.com`
4. Use identical HMAC-SHA256 hashing for OTP and session tokens
5. Respect the `user.status` lifecycle (`guest` → `active` → `suspended`/`deleted`)

### Database Schema

#### SHARED TABLES (from giving-platform — do NOT modify structure)

```sql
-- These tables already exist in the giving-platform database (PlanetScale).
-- The New Human Project reads/writes to them using the same schema.
-- Drizzle casing: snake_case in DB, camelCase in TypeScript.

-- users table (giving-platform schema):
--   id              SERIAL PRIMARY KEY
--   email           VARCHAR(254) NOT NULL
--   email_verified_at TIMESTAMPTZ
--   first_name      VARCHAR(32)
--   last_name       VARCHAR(32)
--   role            TEXT ('admin' | 'user' | 'su') DEFAULT 'user'
--   status          TEXT ('guest' | 'active' | 'suspended' | 'deleted') DEFAULT 'guest'
--   journey         TEXT  -- tracks onboarding state (e.g., 'migrate')
--
-- Other shared tables: sessions, tokens, rate_limit_attempts
-- Additional giving-platform tables (not used by formation): funds, transactions,
--   transaction_items, payments, saved_payment_methods, user_settings
```

#### USER EXTENSIONS (add columns to existing users table)

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS search_handle TEXT UNIQUE;  -- e.g. @john.church
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS church_id UUID;             -- reserved for Phase 2+ multi-church
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;   -- block 1 day 1 starts here
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_subscription JSONB;    -- web push subscription
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{"daily_reminder": true, "reminder_time": "08:00", "friend_requests": true}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_public BOOLEAN DEFAULT TRUE;  -- show completions to friends
```

#### DAILY TASKS (Generic, Extensible)

> **Design principle:** The task and completion schema is generic so that Block 2+ can introduce new task types (journaling, reflective prompts, specific exercises, etc.) without schema migrations. Phase 1 uses task types `scripture`, `mood_log`, and `exercise` — but the schema does not hardcode these.

```sql
-- Defines what tasks exist per day per block (admin-curated)
-- Block 1 Phase 1: 3 tasks per day (scripture + mood_log + exercise)
-- Block 2+ could have any number/type of tasks per day
CREATE TABLE block_day_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_number    INTEGER NOT NULL CHECK (block_number BETWEEN 1 AND 15),
  day_number      INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 25),
  category        TEXT NOT NULL CHECK (category IN ('Physical', 'Mental', 'Emotional')),
  task_type       TEXT NOT NULL,           -- 'scripture_memorise' | 'scripture_study' | 'mood_log' | 'exercise' | 'reflective' | 'tick' | ...
  name            TEXT NOT NULL,           -- e.g. "Memorise Ephesians 1:3", "Study Ephesians 1:1-14", "Mood Log", "Exercise"
  content         JSONB NOT NULL DEFAULT '{}',
  -- For task_type='scripture_memorise': { memory_verse_reference, memory_verse_text, xp_weight: 1 }
  -- For task_type='scripture_study':    { scripture_reference, scripture_text, explanation?, video_url?, xp_weight: 2 }
  -- For task_type='mood_log':           { mood_options: [...], influence_options: [...] }
  -- For task_type='exercise':           {}  (no extra content needed)
  -- For task_type='reflective':         { prompt: "..." }
  -- For task_type='tick':               { description: "..." }
  display_order   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Phase 1 seed example** — each day has 4 tasks (Mental Level 1 + Level 2, Emotional, Physical):
```sql
-- Day 1, Block 1
INSERT INTO block_day_tasks (block_number, day_number, category, task_type, name, display_order, content) VALUES
(1, 1, 'Mental',    'scripture_memorise', 'Memorise Ephesians 1:3', 1, '{
  "memory_verse_reference": "Ephesians 1:3",
  "memory_verse_text": "Praise be to the God and Father of our Lord Jesus Christ, who has blessed us in the heavenly realms with every spiritual blessing in Christ.",
  "xp_weight": 1
}'),
(1, 1, 'Mental',    'scripture_study', 'Study Ephesians 1:1-14', 2, '{
  "scripture_reference": "Ephesians 1:1-14",
  "scripture_text": "Paul, an apostle of Christ Jesus...",
  "explanation": "This opening section introduces...",
  "video_url": "https://youtube.com/watch?v=...",
  "xp_weight": 2
}'),
(1, 1, 'Emotional', 'mood_log',  'Mood Log', 3, '{
  "mood_options": ["terrible", "bad", "okay", "good", "excellent"],
  "influence_options": ["Family", "Friends", "Love", "Work", "School", "Health"]
}'),
(1, 1, 'Physical',  'exercise',  'Exercise', 4, '{}');
```

#### COMPLETIONS (Single Generic Table)

```sql
-- Records that a user completed a specific task
-- The `data` JSONB column stores task-type-specific payloads
CREATE TABLE task_completions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id         UUID NOT NULL REFERENCES block_day_tasks(id) ON DELETE CASCADE,
  data            JSONB NOT NULL DEFAULT '{}',
  -- For task_type='scripture_memorise': {}  (just marks done)
  -- For task_type='scripture_study':    {}  (just marks done)
  -- For task_type='mood_log':           { mood: "good", influences: ["Family", "Work"], context: "Feeling blessed..." }
  -- For task_type='exercise':           {}  (just marks done)
  -- For task_type='reflective':         { response: "My reflection text..." }
  -- For task_type='tick':               {}  (just marks done)
  completed_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, task_id)   -- one completion per user per task
);
```

> **Why this works for Phase 2:** When Block 2 introduces new task types, you just add rows to `block_day_tasks` with a new `task_type` value and define the expected `content`/`data` JSONB shape. No schema migration needed. The frontend reads `task_type` and renders the appropriate UI component.

#### BLOCK COMPLETION

```sql
CREATE TABLE member_block_completions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  block_number    INTEGER NOT NULL DEFAULT 1 CHECK (block_number BETWEEN 1 AND 15),
  completed_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, block_number)
);
```

#### STREAKS

Streaks are **computed on read**, not stored. The query counts consecutive days backwards from today where at least one completion exists:

```sql
WITH completion_dates AS (
  SELECT DISTINCT tc.completed_at::date AS d
  FROM task_completions tc
  WHERE tc.user_id = :userId
),
numbered AS (
  SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d DESC))::int AS grp
  FROM completion_dates
  WHERE d <= CURRENT_DATE
)
SELECT COUNT(*) AS streak
FROM numbered
WHERE grp = (SELECT grp FROM numbered WHERE d = CURRENT_DATE LIMIT 1);
-- Returns 0 if no completion today
```

#### BADGES

```sql
CREATE TABLE badge_definitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,           -- e.g. "Block 1 Complete"
  description     TEXT,
  icon_url        TEXT,
  block_number    INTEGER UNIQUE CHECK (block_number BETWEEN 1 AND 15),
  is_milestone    BOOLEAN DEFAULT FALSE,   -- true for blocks 1, 5, 10, 15
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE member_badges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id        UUID NOT NULL REFERENCES badge_definitions(id),
  earned_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);
```

#### COMMUNITY (FRIENDS)

```sql
CREATE TABLE friend_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (sender_id, receiver_id)
);
```

**Activity Feed Query (fan-out on read):**
```sql
WITH friend_ids AS (
  SELECT CASE
    WHEN sender_id = :myId THEN receiver_id
    ELSE sender_id
  END AS friend_id
  FROM friend_requests
  WHERE status = 'accepted'
    AND (sender_id = :myId OR receiver_id = :myId)
)
SELECT u.display_name, u.avatar_url, t.category, t.name AS activity, tc.completed_at
FROM task_completions tc
JOIN block_day_tasks t ON tc.task_id = t.id
JOIN users u ON tc.user_id = u.id
WHERE tc.user_id IN (SELECT friend_id FROM friend_ids)
  AND u.privacy_public = true
ORDER BY tc.completed_at DESC
LIMIT 50;
```

**Mutual Friend Suggestions:**
```sql
SELECT potential.id, potential.display_name, potential.avatar_url,
       COUNT(*) AS mutual_count
FROM users potential
JOIN friend_requests fr1 ON (potential.id = fr1.sender_id OR potential.id = fr1.receiver_id)
  AND fr1.status = 'accepted'
JOIN friend_requests fr2 ON (fr2.sender_id = :myId OR fr2.receiver_id = :myId)
  AND fr2.status = 'accepted'
WHERE potential.id != :myId
  AND potential.id NOT IN (
    SELECT CASE WHEN sender_id = :myId THEN receiver_id ELSE sender_id END
    FROM friend_requests
    WHERE status = 'accepted'
      AND (sender_id = :myId OR receiver_id = :myId)
  )
GROUP BY potential.id, potential.display_name, potential.avatar_url
HAVING COUNT(*) >= 1
ORDER BY mutual_count DESC
LIMIT 10;
```

#### PUSH NOTIFICATIONS

```sql
CREATE TABLE push_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription    JSONB NOT NULL,          -- Web Push subscription object
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE TABLE notification_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('daily_reminder', 'friend_request')),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  read_at         TIMESTAMPTZ
);
```

### Block Completion + Badge Awarding Logic

```
ON task_completions INSERT:

  -- Check if user has completed at least 1 task in each category for this block
  is_complete = (
    EXISTS task_completions tc
      JOIN block_day_tasks t ON tc.task_id = t.id
      WHERE tc.user_id = :userId AND t.block_number = 1 AND t.category = 'Mental'
    AND EXISTS ... t.category = 'Emotional'
    AND EXISTS ... t.category = 'Physical'
  )

  IF is_complete AND NOT EXISTS member_block_completions(user_id, block_number=1):
    INSERT INTO member_block_completions (user_id, block_number)
    INSERT INTO member_badges (user_id, badge_id) WHERE badge.block_number = 1
    TRIGGER celebration screen on next client load
```

### Streak Break Logic

```
streak_today = EXISTS task_completions
  WHERE user_id = :userId AND completed_at::date = TODAY

IF streak_today:
  streak = count consecutive days backwards from today with any completion
ELSE:
  streak = 0  (streak is broken — resets when no activity for a full day)
```

The streak is **never stored** — it is always computed on read. This avoids stale state and timezone issues.

### Offline Conflict Resolution

- **Strategy**: Last Write Wins (LWW) via `completed_at` timestamp.
- **Offline queue**: Browser IndexedDB via Workbox Background Sync.
- **Duplicate detection**: Unique constraint on `(user_id, task_id)` in `task_completions`.
- **On conflict**: Silently resolve — if a completion already exists for that user+task, ignore the duplicate.

### Content Seeding Workflow

1. Content team prepares Block 1's 25 days of content in a **Google Sheet** with bilingual columns (see Req 95 for full column list):

   | block | day | order | category | task_type | name | memory_verse_ref | memory_verse_text_en | memory_verse_text_zh | scripture_reference | scripture_text_en | scripture_text_zh | explanation_en | explanation_zh | video_url | xp_weight |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
   | 1 | 1 | 1 | Mental | scripture_memorise | Memorise Ephesians 1:3 | Ephesians 1:3 | Praise be to the God... | 愿颂赞归与我们主耶稣基督的父神… | | | | | | | 1 |
   | 1 | 1 | 2 | Mental | scripture_study | Study Ephesians 1:1-14 | | | | Ephesians 1:1-14 | Paul, an apostle... | 奉神旨意… | This opening... | 这段开篇… | https://youtube.com/... | 2 |
   | 1 | 1 | 3 | Emotional | mood_log | Mood Log | | | | | | | | | | |
   | 1 | 1 | 4 | Physical | exercise | Exercise | | | | | | | | | | |

2. Developer runs a **seed script** that reads the CSV and inserts rows into `block_day_tasks`, packing the `_en`/`_zh` columns into locale-keyed JSONB objects in the `content` column (see Req 89, 96).
3. After launch, admin uses the **Admin Daily Content Manager** (page 20) for bilingual edits.

---

## 9. Success Metrics

| Metric | Target |
|---|---|
| Activation | ≥70% of registered members complete at least 1 activity within 7 days |
| Weekly retention | ≥50% of active members complete ≥1 activity per week over first month |
| Category balance | ≥40% of active members complete all 3 categories within the 25-day block |
| Streak engagement | ≥30% of active members maintain a streak of ≥5 days |
| Community engagement | ≥30% of members add at least 1 friend within first 2 weeks |
| Push notification opt-in | ≥50% of members enable daily reminders |
| Block 1 completion | ≥40% of registered members complete Block 1 |
| Qualitative | Positive feedback from ≥5 participants that the app feels encouraging |
| Performance | App loads under 3 seconds on mobile on standard connection |

---

## 10. Decisions Log

| # | Question | Status | Decision |
|---|---|---|---|
| 1 | App name | ✅ Decided | The New Human Project |
| 2 | Auth strategy | ✅ Decided | Custom email OTP — shared DB with giving-platform (PlanetScale + Neon driver + Drizzle). No Supabase. |
| 3 | Framework | ✅ Decided | Next.js (App Router) + pnpm. Giving platform uses TanStack Start; apps share DB, not framework. |
| 4 | Phase 1 scope | ✅ Decided | Block 1 only (25 days). Multiple blocks deferred to Phase 2. |
| 5 | Mental component | ✅ Decided | Ephesians scripture study — **two levels per day**: Level 1 (memorise the verse, 1 XP) and Level 2 (read explanation + Ephesians passage, 2 XP). Deeper engagement grows the Mental axis on the radar chart. |
| 6 | Emotional component | ✅ Decided | Daily mood log — emoji (5 levels) → influence tags (6 options) → optional free-text. |
| 7 | Physical component | ✅ Decided | Simple exercise tick-box. Honour system — no exercise type required. |
| 8 | Community scope | ✅ Decided | Full community in Phase 1: friends, feed, add friend, friend requests, people you may know. |
| 9 | Push notifications | ✅ Decided | Phase 1: daily reminders + friend requests only. Friend activity notifications deferred to Phase 2. |
| 10 | Badge system | ✅ Decided | Full badge UI for Block 1 completion in Phase 1. |
| 11 | Streak logic | ✅ Decided | Complete ≥1 activity/day to maintain streak. Miss a full day → streak resets to 0. Computed on read. |
| 12 | Activity library | ✅ Decided | Deferred to Phase 2. Phase 1 users complete predefined daily content only. |
| 13 | Spiritual Health Assessment | ✅ Decided | Deferred to Phase 2. |
| 14 | Resource library | ✅ Decided | Deferred to Phase 2. Guides live within the daily task content for Phase 1. |
| 15 | Content pipeline | ✅ Decided | Google Sheet for initial seed → seed script → Admin UI for ongoing edits. |
| 21 | Schema extensibility | ✅ Decided | Generic `block_day_tasks` + `task_completions` schema with JSONB `content`/`data` columns. New task types for Block 2+ require no schema migration — just new rows and a new frontend renderer component. |
| 22 | Radar chart scoring | ✅ Decided | Percentage-based (0–100%) per axis, normalised against days elapsed. Mental uses weighted XP (Level 1 = 1, Level 2 = 2, max 3/day). Resets per block. Ghost overlay of previous block deferred to Phase 2. |
| 23 | i18n approach | ✅ Decided | `next-intl` for UI strings (JSON message files). Database JSONB locale-keyed objects for content (Scripture, explanations). Client-side locale via `localStorage` + cookie. No URL-based routing. Two languages: EN + ZH. |
| 24 | Chinese font support | ✅ Decided | Noto Sans SC (Google Fonts) as primary CJK fallback, with PingFang SC (Apple) and Microsoft YaHei (Windows) system fallbacks. |
| 16 | Content ownership | 🟡 Pending | Content team must prepare 25 days of Ephesians content (passages, explanations, videos) **in both English and Chinese**. Must be ready before dev completes the Mental feature. |
| 17 | Domain structure | 🟡 Pending | Both apps need sibling subdomains for shared cookie auth. Needs DevOps decision. |
| 18 | Privacy policy | 🟡 Pending | Must be drafted before launch — mood log data is sensitive. |
| 19 | iOS web push | 🟡 Pending | iOS Safari web push requires specific handling. Is iOS required at launch? |
| 20 | Giving platform coordination | 🟡 Pending | Adding columns to shared `users` table requires alignment with giving-platform team. |
| 25 | Database hosting | ✅ Decided | PlanetScale (Postgres-compatible), not Neon-hosted. The `@neondatabase/serverless` package is the connection driver only. Drizzle uses `snake_case` DB casing. Giving platform user roles are `user`/`admin`/`su` (not `member`); user status lifecycle is `guest` → `active` → `suspended`/`deleted`. |

---

*PRD v2.4 — Corrected database hosting: PlanetScale (Postgres-compatible), not Neon-hosted. `@neondatabase/serverless` is the connection driver only. Documented actual giving-platform user schema: `role` enum is `user`/`admin`/`su` (not `member`), `status` enum is `guest`/`active`/`suspended`/`deleted`, includes `journey` field. Added `snake_case` Drizzle casing strategy. Documented dual connection modes (HTTP + WebSocket via `drizzle-orm/neon-http` and `drizzle-orm/neon-serverless`). Listed all giving-platform tables for reference.*

*PRD v2.3 — Added internationalisation (i18n) specification: English/Chinese bilingual support via `next-intl` for UI strings and locale-keyed JSONB for database content. Language toggle in header (compact pill showing inactive language) + Profile settings. Locale persisted in `localStorage` + cookie (for server-side push notification text). Chinese font fallback chain: Noto Sans SC → PingFang SC → Microsoft YaHei. Updated content seeding workflow with bilingual columns. Updated admin content manager for side-by-side EN/ZH input. No schema migration required — uses existing JSONB `content` column with nested locale keys.*

*PRD v2.2 — Added radar chart scoring specification (percentage-based, 0–100% per axis, resets per block, ghost overlay deferred to Phase 2). Split Mental into two levels: Level 1 (memorise verse, 1 XP) and Level 2 (study passage + explanation + video, 2 XP). Updated schema task types from `scripture` to `scripture_memorise` + `scripture_study`. Updated seed examples, content seeding workflow, admin content management, and task renderer architecture to reflect the two-level Mental structure.*
