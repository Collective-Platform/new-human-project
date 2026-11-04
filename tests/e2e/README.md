# Browser tests

The first set has 13 tests. It covers completion and undo in EN/ZH, saved mood,
reflection and exercise inputs, language switching, access control, onboarding,
logout, and desktop navigation. Tests use real Server Actions and database saves.

## Tests that run

`pnpm test:e2e` runs these 13 browser tests. Mobile tests use Chromium with the
Pixel 7 device settings. Desktop tests use Desktop Chrome settings. EN and ZH
variants are listed as separate tests.

| Test                                    | File                                 | Device  | Language     | What it checks                                                                                                                                                             |
| --------------------------------------- | ------------------------------------ | ------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Signed-out access (EN)                  | [access.spec.ts](access.spec.ts)     | Mobile  | EN           | Home sends signed-out visitors to EN landing; progress and admin send them to EN login.                                                                                    |
| Signed-out access (ZH)                  | [access.spec.ts](access.spec.ts)     | Mobile  | ZH           | Home sends signed-out visitors to ZH landing; progress and admin send them to ZH login.                                                                                    |
| Onboarding                              | [access.spec.ts](access.spec.ts)     | Mobile  | EN           | A new member must choose a username. The dashboard opens after onboarding and remains available after reload.                                                              |
| Logout                                  | [access.spec.ts](access.spec.ts)     | Mobile  | EN           | Logout removes protected access. Reload and reuse of the old session cookie do not restore access. The old cookie still permits EN/ZH login and signup.                    |
| Signed-in login and signup              | [access.spec.ts](access.spec.ts)     | Mobile  | EN, ZH       | A member with a valid session who opens EN/ZH login or signup is sent to the dashboard.                                                                                    |
| Complete and undo (EN)                  | [progress.spec.ts](progress.spec.ts) | Mobile  | EN           | A devotional completion and selected day survive reload and a trip to the dashboard and back. Undo survives reload. The missed-day count changes with completion and undo. |
| Complete and undo (ZH)                  | [progress.spec.ts](progress.spec.ts) | Mobile  | ZH           | The same completion, navigation, undo, and missed-day checks work in Chinese.                                                                                              |
| Language switching                      | [progress.spec.ts](progress.spec.ts) | Mobile  | EN → ZH → EN | The day query stays in the URL, translated controls appear, and saved completion stays visible after each switch.                                                          |
| Mood log                                | [progress.spec.ts](progress.spec.ts) | Mobile  | EN           | Mood, influence, and context are saved in the database and remain in the form after reopening and reload.                                                                  |
| Reflection                              | [progress.spec.ts](progress.spec.ts) | Mobile  | EN           | Reflection text is saved automatically and remains after reopening and reload.                                                                                             |
| Exercise                                | [progress.spec.ts](progress.spec.ts) | Mobile  | EN           | Activity and duration are saved in the database and remain in the form after reopening and reload.                                                                         |
| Member navigation and admin restriction | [desktop.spec.ts](desktop.spec.ts)   | Desktop | EN           | A member can open progress through app navigation but is redirected away from admin.                                                                                       |
| Admin access                            | [desktop.spec.ts](desktop.spec.ts)   | Desktop | EN           | An admin can open the admin page and see the prepared member's email.                                                                                                      |

The separate [environment check](../../scripts/e2e-environment.test.ts) runs with
`pnpm exec tsx --test scripts/e2e-environment.test.ts`. It checks database guards,
credential isolation, migration settings, and the explicit YouVersion test key.
It does not connect to a database and is not part of `pnpm test:e2e`.

The separate [auth proxy check](../../scripts/auth-proxy.test.ts) runs with
`pnpm exec tsx --test scripts/auth-proxy.test.ts`. It checks that a stale session
cookie permits EN/ZH login, signup, and verification routes, while a signed-out
visitor is redirected from progress to login. It needs no server or database.

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
