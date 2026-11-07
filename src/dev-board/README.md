# Design board

A dev-only, Figma-style canvas that shows every screen and popup as a live frame.
Open it at `http://localhost:3000/en/dev/board` while `pnpm dev` runs. It returns 404 in production.

## How it works

- `registry.ts` lists every frame (title, group, size, source files). Add a screen here.
- `/[locale]/dev/frame/[id]` renders one frame. Public pages use the real page component.
  Member screens and popups use the real client component with sample data from `fixtures.ts`
  and real program content from `data/program/`. No database is read or written.
- `frame-bridge.tsx` blocks saving inside frames (server actions and non-GET requests).
- `board.tsx` is the canvas, the frame toolbar and the side panel.
- `app/api/dev/board/route.ts` + `source-edit.ts` write edits into source files.
  Local host only, needs the `x-board` header, and writes only inside `app/`, `src/`, `messages/`.
- `next.config.ts` allows same-site framing in dev only. Production keeps `DENY`.

## Local DB data mode

Top bar: **Data → Local DB**, then pick a member. Frames marked **DB** run the app's own
`*-data.tsx` components as that member, so you see real rows. It is read-only: saving is blocked
in frames and only SELECT queries run.

Safety rules (see `enabled.ts`):

- Works only when `DATABASE_PROVIDER=local` and `DATABASE_URL` host is localhost / 127.0.0.1.
  Neon, PlanetScale or any remote host turns it off.
- Works only when the board itself is enabled (not production, not Vercel).
- It sets a `board_user` cookie. `getSessionUser()` in `src/features/auth/session.ts` honours it
  only under those two rules. The cookie is cleared when you switch back to Sample.
- Screens without a **DB** mark (popups, public pages) always show sample or real program content.

## Adding frames

Top bar: **+ Add frame**. Copy any screen (for EN and 中文 side by side, or phone and desktop),
or add any same-site path. Custom frames are saved in this browser and have a ✕ to remove them.

## Editing from the board

Press ✎ on a frame, click text or a box. The panel finds that exact text (or class string) in the
code and writes your change there. Text built from variables or templates is not found; use the
file list to open it in the editor. Colours tab edits hex values in `app/globals.css`.

## Plans and group discussion frames

The app is plan-based now: `/progress` lists plans, `/progress/[planId]` is a plan's day view, and
shared plans add members, invite links and a discussion ("Talk it out"). The board has frames for
the plans list, solo and group day views, the discussion screen, the join-by-invite pages, the
create / leave / menu / members popups, the empty dashboard and the UI lab. The old Complete
Block button is no longer reachable in the app, so it has no frame. The two "finished block"
screens were removed from the code.

## Limits

- In Local DB mode, plan screens need the plans migration on the local database
  (`task_completions.plan_id`). If it is missing, the frame says so. Running `pnpm db:migrate`
  needs the owner's approval.

- Live event pages (`/live`) are real routes, not sample-data frames. Saving is not blocked there (the page has no backend).
- The member header bell and avatar are not shown (they need a signed-in user).
- Onboarding step 2 (install prompt) is internal state and has no frame.
- The dashboard live banner is commented out in `dashboard-client.tsx`, so it has no frame.
- Layout and custom frames are saved in the browser (localStorage), not in the repo.
- In dev, many frames loading at once is slow (every page compiles on first load). Zoom into one area first.
