# Browser tests

The first set has 18 tests. It covers completion and undo in EN/ZH, saved mood,
reflection and exercise inputs, language switching, access control, onboarding,
group invite links, logout, and desktop navigation. Tests use real Server Actions and database saves.

## Tests that run

`pnpm test:e2e` runs these 18 browser tests. Mobile tests use Chromium with the
Pixel 7 device settings. Desktop tests use Desktop Chrome settings. EN and ZH
variants are listed as separate tests.

| Test                                    | File                                 | Device  | Language     | What it checks                                                                                                                                                                   |
| --------------------------------------- | ------------------------------------ | ------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Signed-out access (EN)                  | [access.spec.ts](access.spec.ts)     | Mobile  | EN           | Home sends signed-out visitors to EN landing; progress and admin send them to EN login.                                                                                          |
| Signed-out access (ZH)                  | [access.spec.ts](access.spec.ts)     | Mobile  | ZH           | Home sends signed-out visitors to ZH landing; progress and admin send them to ZH login.                                                                                          |
| Onboarding                              | [access.spec.ts](access.spec.ts)     | Mobile  | EN           | A new member must choose a username. They then land inside their Ephesians plan page and stay there after reload.                                                                |
| Logout                                  | [access.spec.ts](access.spec.ts)     | Mobile  | EN           | Logout removes protected access. Reload and reuse of the old session cookie do not restore access. The old cookie still permits EN/ZH login and signup.                          |
| Invite after login (EN)                 | [access.spec.ts](access.spec.ts)     | Mobile  | EN           | A signed-out visitor to an invite goes to login with a return path, the Sign up link keeps it, and the code step returns them to the invite. Email and code delivery are mocked. |
| Invite after login (ZH)                 | [access.spec.ts](access.spec.ts)     | Mobile  | ZH           | The same flow on the Chinese routes.                                                                                                                                             |
| Unsafe return path                      | [access.spec.ts](access.spec.ts)     | Mobile  | EN           | A return path that is not an invite page is ignored after login, so the member goes to Home.                                                                                     |
| Invite for a new member                 | [access.spec.ts](access.spec.ts)     | Mobile  | EN           | An invite sends a member without a username to onboarding, then back to the invite, and Join adds them to the group.                                                             |
| Signed-in login and signup              | [access.spec.ts](access.spec.ts)     | Mobile  | EN, ZH       | A member with a valid session who opens EN/ZH login or signup is sent to the dashboard.                                                                                          |
| Complete and undo (EN)                  | [progress.spec.ts](progress.spec.ts) | Mobile  | EN           | A devotional completion and selected day survive reload and a trip to the dashboard and back. Undo survives reload. The missed-day count changes with completion and undo.       |
| Complete and undo (ZH)                  | [progress.spec.ts](progress.spec.ts) | Mobile  | ZH           | The same completion, navigation, undo, and missed-day checks work in Chinese.                                                                                                    |
| Language switching                      | [progress.spec.ts](progress.spec.ts) | Mobile  | EN → ZH → EN | The day query stays in the URL, translated controls appear, and saved completion stays visible after each switch.                                                                |
| Mood log                                | [progress.spec.ts](progress.spec.ts) | Mobile  | EN           | Mood, influence, and context are saved in the database and remain in the form after reopening and reload.                                                                        |
| Reflection                              | [progress.spec.ts](progress.spec.ts) | Mobile  | EN           | Reflection text is saved automatically and remains after reopening and reload.                                                                                                   |
| Exercise                                | [progress.spec.ts](progress.spec.ts) | Mobile  | EN           | Activity and duration are saved in the database and remain in the form after reopening and reload.                                                                               |
| Member navigation and admin restriction | [desktop.spec.ts](desktop.spec.ts)   | Desktop | EN           | A member can open progress through app navigation but is redirected away from admin.                                                                                             |
| Admin access                            | [desktop.spec.ts](desktop.spec.ts)   | Desktop | EN           | An admin can open the admin page and see the prepared member's email.                                                                                                            |

The separate [environment check](../../scripts/e2e-environment.test.ts) runs with
`pnpm exec tsx --test scripts/e2e-environment.test.ts`. It checks database guards,
credential isolation, migration settings, and the explicit YouVersion test key.
It does not connect to a database and is not part of `pnpm test:e2e`.

The separate [auth proxy check](../../scripts/auth-proxy.test.ts) runs with
`pnpm exec tsx --test scripts/auth-proxy.test.ts`. It checks that a stale session
cookie permits EN/ZH login, signup, and verification routes, while a signed-out
visitor is redirected from progress to login. It needs no server or database.

The separate [maintenance check](../../scripts/maintenance.test.ts) runs with
`pnpm exec tsx --test scripts/maintenance.test.ts`. It has 7 tests. They check that with
`MAINTENANCE_MODE=1` pages, server actions, API routes and cron jobs get a 503, that the notice has
both languages, that Rhythm Live pages stay open, and that only the right secret bypasses it. It
needs no server or database.

The separate [return path check](../../scripts/return-path.test.ts) runs with
`pnpm exec tsx --test scripts/return-path.test.ts`. It has 2 tests. They check that only invite
pages are accepted as a return path after login. It needs no server or database.

The separate [shared logs check](../../scripts/shared-logs.test.ts) runs with
`pnpm exec tsx --test scripts/shared-logs.test.ts`. It has 20 tests. They check that
mood and exercise logs are copied between a member's active blocks (a today log goes to
each block's current day, a backfilled day goes to the same calendar date), that edits and removals follow in both directions, that
several exercise entries all copy, that copied rows are marked, that dates outside
the other block and future days are skipped, that devotionals are never shared, and
that a block started mid-day receives today's logs, and that a block past its 25 days
neither receives nor sends copies and keeps its own Day 25 log, that deleting or leaving a block
turns exactly one copy of each of its logs into an original, that a copied log that finishes
another block reports that block, that a new block ignores an older day of another plan of the same
block, that two saves of a plan's last task at once finish it once without an error, that a member
who joins a running block gets mood and exercise from its earlier days (also from a finished block)
with the original dates and without overwriting a day that has a log, that a second copy changes
nothing, that copied logs count in the plan's final streak, and that the notice about copied logs
shows only for logs that were copied in when the member joined (not for ordinary copies, even old
ones), that this flag is not passed on to other blocks, and that Day 25 of a block past its 25 days
is not copied in, because its real date is unknown. It needs `.env.test.local` and the
local `rhythm_test` database with all migrations applied, and it refuses any other
database. It creates one test user with three blocks and deletes them at the end.
It is not part of `pnpm test:e2e`.

The separate [home dashboard check](../../scripts/home-dashboard.test.ts) runs with
`pnpm exec tsx --test scripts/home-dashboard.test.ts`. It has 10 tests. They check that Home
reads all active blocks together: copied mood and exercise logs are counted once in the mood
and exercise charts, the month calendar shows each date once with its categories and keeps the days of finished blocks lit, the streak
counts any day with any completion in any block, a member with no active block gets an empty
Home, the triangle averages blocks by days elapsed, and Home celebrates an unseen badge of a
finished block but not a legacy badge. It uses the same `rhythm_test`
guard and clean-up as the shared logs check and is not part of `pnpm test:e2e`.

The separate [legacy plan script check](../../scripts/migrate-legacy-plans.test.ts) runs with
`pnpm exec tsx --test scripts/migrate-legacy-plans.test.ts`. It has 5 tests. They run the real
`scripts/migrate-legacy-plans.ts` and check that a finished block keeps its original completion
date, that old task completions link to the legacy plan, that every block before the current one is
completed by time with no badge, that a second run keeps the finished date of a block with no old
milestone, and that a second run adds no rows and repairs a wrong date. It uses the same `rhythm_test` guard and is not part of `pnpm test:e2e`. The
script reads every user in `rhythm_test`, so leftover test users there also get legacy plans. The
test creates one user and deletes that user at the end.

The separate [daily reminder check](../../scripts/daily-reminder.test.ts) runs with
`pnpm exec tsx --test scripts/daily-reminder.test.ts`. It has 7 tests. They check that the
reminder looks at every active block of a member and not at one chosen block: a member with two
active blocks gets a reminder, it still
comes when only one block has tasks left today, it stops when every active block is done,
a block past its 25 days does not trigger a reminder, finishing one block does not stop reminders
for the other, a different reminder hour gives no reminder, and a member who finished every block is not in the list. It calls the preview function,
so it never sends a push. It uses the same `rhythm_test` guard and clean-up as the shared logs
check and is not part of `pnpm test:e2e`.

The separate [legacy block schedule check](../../scripts/legacy-block-schedule.test.ts) runs with
`pnpm exec tsx --test scripts/legacy-block-schedule.test.ts`. It has 4 tests. They check the frozen
copy of the old block launch dates that `scripts/migrate-legacy-plans.ts` uses: block start dates
(block 2 starts July 6, block 7 starts Nov 8), block end dates, that a member who onboarded by June 1 is on block 6,
Day 25 on Nov 7, and that a late member starts block 2 on the later of the two dates. It needs no
server or database. It is not part of `pnpm test:e2e`.

The separate [plan member status check](../../scripts/plan-member-status.test.ts) runs with
`pnpm exec tsx --test scripts/plan-member-status.test.ts`. It has 5 tests. They check that the
status read by the join page tells an active member, a member who left (`removed`), a member the
owner removed (`kicked`) and a person who never joined apart; that removing a member keeps their
task completions and finished-block record and that adding them back restores them; that adding
back an active member changes nothing and a new person is added; and that a member who left can
also be brought back by the owner; and that a plan id that is not a UUID is treated as not found. It calls `kickMember` and `reinstateMember` in
`src/features/plans/membership.ts`. It uses the same `rhythm_test` guard and clean-up as the
shared logs check and is not part of `pnpm test:e2e`. Not tested yet: that `joinPlan` refuses a
`kicked` member and returns the right error code, that the Add members tab shows a removed friend,
and the real join flow in a browser. The join popups ("You were removed", invalid invite, plan not
open, plan finished, "Could not join") were only looked at by hand as Design Board frames
(`join-plan-removed`, `join-plan-error`) at 390 px in English and Chinese and at 320 px in
English. No automatic browser test covers them.

The separate [plan start marker check](../../scripts/plan-start-marker.test.ts) runs with
`pnpm exec tsx --test scripts/plan-start-marker.test.ts`. It has 3 tests. They check that a plan
started at 07:00 in Kuala Lumpur sends the local start date (a UTC-midnight marker) to the client,
that the client's "today" then matches the server's current day, and that a plan is past its last
day only from the day after Day 25. This guards the "Today is one
day ahead" bug. It needs no server or database. It is not part of `pnpm test:e2e`.

Use `pnpm test:e2e --list` for the exact test names and configured projects.
The catalog describes test coverage; it does not mean the tests have passed.

## Keep this document current

Update this README in the same change that adds, changes, removes, or renames a
test. Keep the catalog, test count, device and language coverage, setup commands,
environment requirements, output paths, and limits consistent with the code.
Run `pnpm test:e2e --list` to check the catalog after a test or project change.

When app behavior changes, check for gaps in the catalog. Add relevant tests
within the task scope, or record missing coverage under **Limits and pending
checks**. Keep planned tests separate from tests that already run. Record actual
validation results and any blockers; do not mark an unrun test as passed.
Do not put real credentials, private data, or generated reports in this document.

## Local setup

1. Install packages with `pnpm install`.
2. Install Chromium with `pnpm exec playwright install chromium`.
3. Copy `tests/e2e/env.example` to `.env.test.local` and set the local credentials.
   Use a separate database named **rhythm_test**. Do not use `new_human_dev`.
   Set `YVP_APP_KEY` and the EN/ZH Bible IDs to versions available to that key.
   The progress page needs this key to load Bible text on the server.
4. Have the existing migrations applied to that database **only after approval**.
   Use `pnpm db:migrate:test`. It reads `.env.test.local` and permits only local
   `rhythm_test`. Browser-test service restrictions do not apply to migrations.
   It uses the existing
   migration files and does not create or reset the database.
   The test commands never create, reset, or migrate a database. Do not use
   `pnpm db:reset-local`, which targets the development database. The normal
   Drizzle config reads `.env.local`; do not use it unchanged for test migrations.
   No development users or program-content seed is needed for these tests.
5. Run `pnpm test:e2e` twice to check isolation and persistence.

```sh
pnpm test:e2e --list                    # List tests without database access
pnpm test:e2e                         # Production build, server, browser tests
pnpm test:e2e:ui                      # Interactive runner with the same settings
pnpm test:e2e --retries=1              # Record a trace on the first retry
pnpm test:e2e --grep 'completion'      # Run the main progress flow
pnpm exec tsx --test scripts/e2e-environment.test.ts  # Check database guards, no DB access
```

The server uses `127.0.0.1:3100`. It does not reuse a running development server.
Each run builds with production settings and writes the usual `.next/` build.
Stop a development server in this workspace first to avoid sharing that output.
The runner loads `.env.test.local` before the application environment or DB
modules. The fixture loads app modules with deferred, typed `require()` calls so
Playwright resolves nested `@/` aliases in its CommonJS worker. This also keeps
`--list` independent of app environment settings. It masks normal env-file keys and disables email, payment, push, and
Google service credentials. It allows the YouVersion key set in `.env.test.local`;
it never inherits that key from development settings. These tests can make real
YouVersion requests. They do not yet assert the returned Bible text.
It rejects missing settings, remote databases, the development database, and
`rhythm_test` if a normal env file also uses it. Environment reads in these test
tools are needed to prepare the Next.js child process; app settings stay in `src/env.ts`.

The desktop navigation test waits for the dashboard client effect to encode the
`tz` cookie before clicking. The server-rendered navigation can appear before
hydration completes. This check uses the fixture's raw timezone cookie as its
starting value; keep it consistent with the dashboard's timezone effect.

Each test that needs a member creates its own user and hashed-token session.
Retries create a new user. Cleanup deletes only that user and related rows.
A killed process can leave test users in `rhythm_test`; there is no broad cleanup
or reset command. Browser contexts are fresh. Timezone and the `tz` cookie use
`Asia/Kuala_Lumpur`. New members start in block 1, and tests select its first day.
Task IDs and names come from the existing content registry.

## Output

| File        | Location                      | When         |
| ----------- | ----------------------------- | ------------ |
| Screenshots | `.context/test-results/`      | Test failure |
| Traces      | `.context/test-results/`      | First retry  |
| HTML report | `.context/playwright-report/` | Each run     |

Local runs have no retries by default, so they produce no first-retry trace.
CI settings use one retry. There is no GitHub Actions workflow yet.
Open reports with `pnpm exec playwright show-report .context/playwright-report`.
All output and `.env.test.local` are ignored by Git. Reports and traces can
contain test session data; do not publish them without checking their contents.

## Limits and pending checks

Finished plans, plan days and not-found pages (7 November 2026): a one-off browser check against a
production build on `rhythm_test`, at 390px in a mobile browser: 26 of 27 checks passed. The one
failure saw the list skeleton still on screen 1.5 seconds after the real list appeared. Over 8 more
round trips, it was gone within 4 seconds each time, but once it stayed beside the real list for
about 300ms. The cause is not known. It is not in
`tests/e2e`, so it does not run again. It covered: the popup in EN and ZH after the last task, from
the task list and from inside a task page; Continue going to the Active tab of `/progress`; the plan
moving to Completed; a second plan opening on its own day; a `?day=` link; the saved day coming back;
the plans list and plan day loading skeletons on the right routes; the date format on plan cards;
and the not-found page for `/en/progress/abc` and `/en/ui-lab`. Those two pages return HTTP 200
with the not-found content, because the response starts before the page decides. `/en/dev/board`
returns 404. No browser test covers staying on the plan when a copied log finishes another block.
`scripts/` checks on `rhythm_test`, which does not have migration `0006` yet: shared logs 14 of 14,
home dashboard 9 of 9, member status 5 of 5, daily reminder 7 of 7, legacy plan script 5 of 5.

Review fixes (7 November 2026): shared logs 20 of 20 and member status 5 of 5 passed on
`rhythm_test`. No test covers two of the fixes, because they are server actions that need a signed-in
session: `joinPlan` no longer changes the row of an active member who reopens the invite, and
`deleteOwnedPlan` also keeps the shared logs of removed (`kicked`) members.

Legacy plan script check: 5 of 5 passed on `rhythm_test`. It has not run against the live database.

Group invite links (4 browser tests): written and listed, but not run yet. `pnpm test:e2e` stops
before it starts because `.env.test.local` has `MAILERSEND_API_KEY`, which the test guard refuses.
Remove the keys that the guard names, then run `pnpm test:e2e tests/e2e/access.spec.ts`. The return
path check passed 2 of 2. The home dashboard check passed 7 of 7 on `rhythm_test`.

Onboarding starts Ephesians (not tested yet): when a new member presses Continue on the
"Set up your experience" step, `startFoundationPlan` creates a solo block 1 plan (or reuses
an existing one) and opens it at `/progress/<planId>`. If it fails, the member goes to Home.
No browser test covers this, the repeat-press case, or the Chinese text. Type check and
lint pass; no browser run was made. Members who onboarded before this change and have no
plan get no suggestion; they see the normal empty Plans page.

Shared logs check (added with the shared mood and exercise logs): 8 of 8 tests passed
on a scratch local database built from the current migrations, then dropped. It has not
run on `rhythm_test`: that database does not yet have the newest migration (the
`users.dashboard_plan_id` column is missing), so all 8 tests fail there with a query
error. Run `pnpm db:migrate:test` after approval, then run the check again.
Members added to a block by its owner are treated as new to that block; their earlier
logs are not copied in.

Update after the check above: `pnpm db:migrate:test` was applied to `rhythm_test` with
approval, and the shared logs check then passed 8 of 8 there.

Update for copies of removed blocks: the shared logs check now has 10 tests and passed
10 of 10 on `rhythm_test`. The Home check also has a new test for a copy whose original's
block is gone, and it passed 6 of 6 there.
Home no longer has a block dropdown. It reads all active blocks together
(`computeHomeDashboard`, wrapped by the cached `getHomeDashboard`). The home dashboard
check above passed 5 of 5 on `rhythm_test`. The Home screens themselves (empty state,
chart labels, Chinese text) have no browser test yet; they were only rendered through the
design board frames.

Auth-cookie fix (6 October 2026): the direct proxy check failed before the fix
and passed after it. Test discovery found 12 browser scenarios at that time. The logout
test now checks EN/ZH login and signup with the revoked cookie; it passed on
14 October 2026. A switch between two real databases remains
unverified. Login and signup layouts now redirect members with a valid
session to the dashboard (`GuestGate`). Validation (14 October 2026): a targeted
run passed the new redirect test and the logout test. A full run passed 12 tests
and failed the ZH completion test again: after the app-link trip back to
progress, the URL was `/zh/progress` without `?day=1`. The cached-page URL
fix described below does not yet resolve that case. Restart `pnpm dev` after changing database settings: the database
client is kept in memory across hot reloads.

The user reports that `rhythm_test` has been created and migrations have been
applied. No migrations were run during test diagnosis.

Validation (6 October 2026): the last completed full run passed 11 tests
and failed the ZH completion test. That failure exposed a cached page whose
selected day already matched the context: restoration skipped the URL update.
The URL update now runs for that case too. The next build failed while
downloading two Noto Sans SC font files from `fonts.gstatic.com` (connection
timeout), before browser tests started. The final cached-page fix therefore
has no full-suite result yet. Re-run `pnpm test:e2e` when those font downloads
are available; the full suite and a clean repeat run remain pending.

Test discovery now finds 13 scenarios. Type checks and the environment guard check
pass. Lint has seven existing warnings and no errors. The repository format
check finds 17 pre-existing issues, including existing formatting in
`progress-client.tsx`; formatting checks on the test files and language toggle
pass. A temporary browser-only check confirmed failure screenshots and
first-retry traces; it was removed, and its output stays in
`.context/artifact-check-results/`.

The first full run failed during fixture imports with
`Cannot find module '@/src/env'`. A temporary import-only test reproduced that
error and passed with deferred `require()` calls. It made no database queries
and was removed. The existing member tests cover fixture loading.

Browser checks also exposed wrong redirect expectations, an onboarding step
already bypassed by the server gate, early clicks before hydration, and lost
selected-day URLs. The access tests now match the current redirects and
onboarding flow. Desktop navigation waits for the dashboard client effect;
three consecutive targeted runs passed. Progress controls are inert until the
completion context is initialized. The language toggle keeps query parameters
and the hash. Progress restoration updates the URL through Next.js's History
API integration, including after Server Actions. EN/ZH completion and language
tests assert `?day=1` after navigation and undo.

OTP email delivery, WebKit, community, failed-save rollback, payments, push
delivery, and installed/offline PWA checks remain outside this first set.
Service workers are blocked to keep browser requests separate from PWA caching.

See [Playwright configuration](https://playwright.dev/docs/test-configuration)
and [fixtures](https://playwright.dev/docs/test-fixtures) for runner behavior.
