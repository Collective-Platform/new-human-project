// Every screen and popup shown on the design board.
// `render: "page"` and `"fixture"` frames load /{locale}/dev/frame/{id}.
// `render: "route"` frames load a real route as-is (no login needed).

export type FrameGroup = "public" | "live" | "member" | "plans" | "popups";

export interface FrameDef {
  id: string;
  title: string;
  group: FrameGroup;
  render: "page" | "fixture" | "route";
  /** For render "route": the real URL. `{locale}` is replaced. */
  route?: string;
  /** Extra query string for the frame URL. */
  query?: string;
  width: number;
  height: number;
  /** Custom frames reuse another frame's page: the id of that frame. */
  frameId?: string;
  /** True for frames the user added on the board. */
  custom?: boolean;
  /** True when the frame can show real data from the local database. */
  liveData?: boolean;
  /** Source files behind this frame (repo-relative). First one opens by default. */
  files: string[];
}

const M = "app/[locale]/(member)";

export const GROUPS: { id: FrameGroup; title: string; note: string }[] = [
  { id: "public", title: "Public & sign-in", note: "No login needed" },
  { id: "live", title: "Rhythm Live event", note: "Own site, English only" },
  { id: "member", title: "Member app", note: "Sample data, real components" },
  {
    id: "plans",
    title: "Plans & group discussion",
    note: "Solo and shared blocks, invites, discussion",
  },
  { id: "popups", title: "Popups & sheets", note: "Shown already open" },
];

export const FRAMES: FrameDef[] = [
  // ── Public ──
  {
    id: "landing",
    title: "Landing",
    group: "public",
    render: "page",
    width: 390,
    height: 844,
    files: ["app/[locale]/landing/page.tsx"],
  },
  {
    id: "login",
    title: "Log in",
    group: "public",
    render: "page",
    width: 390,
    height: 844,
    files: ["app/[locale]/login/page.tsx", "app/[locale]/login/login-form.tsx"],
  },
  {
    id: "login-verify",
    title: "Log in — enter code",
    group: "public",
    render: "page",
    query: "email=sample@example.com",
    width: 390,
    height: 844,
    files: ["app/[locale]/login/verify/page.tsx", "app/[locale]/login/verify/verify-form.tsx"],
  },
  {
    id: "signup",
    title: "Sign up",
    group: "public",
    render: "page",
    width: 390,
    height: 844,
    files: ["app/[locale]/signup/page.tsx", "app/[locale]/signup/signup-form.tsx"],
  },
  {
    id: "signup-verify",
    title: "Sign up — enter code",
    group: "public",
    render: "page",
    query: "email=sample@example.com",
    width: 390,
    height: 844,
    files: ["app/[locale]/signup/verify/page.tsx"],
  },
  {
    id: "onboarding",
    title: "Onboarding — pick username",
    group: "public",
    render: "page",
    width: 390,
    height: 844,
    files: ["app/[locale]/onboarding/page.tsx"],
  },

  // ── Live ──
  {
    id: "live",
    title: "Live event page",
    group: "live",
    render: "route",
    route: "/live",
    width: 390,
    height: 844,
    files: [
      "app/live/page.tsx",
      "app/live/schedule-section.tsx",
      "app/live/faq-section.tsx",
      "app/live/pillars-section.tsx",
      "app/live/tilt-book-section.tsx",
      "app/live/countdown-timer.tsx",
      "app/live/registered-banner.tsx",
    ],
  },
  {
    id: "live-terms",
    title: "Live event — terms",
    group: "live",
    render: "route",
    route: "/live/terms",
    width: 390,
    height: 844,
    files: ["app/live/terms/page.tsx"],
  },

  // ── Member ──
  {
    id: "dashboard",
    liveData: true,
    title: "Dashboard (home)",
    group: "member",
    render: "fixture",
    width: 390,
    height: 844,
    files: [
      `${M}/dashboard/dashboard-client.tsx`,
      `${M}/dashboard/foundation-card.tsx`,
      `${M}/dashboard/live-banner.tsx`,
      `${M}/dashboard/radar-chart.tsx`,
      `${M}/dashboard/streak-badge.tsx`,
      `${M}/dashboard/activity-calendar.tsx`,
      `${M}/dashboard/emotion-breakdown-chart.tsx`,
      `${M}/dashboard/physical-activity-chart.tsx`,
    ],
  },
  {
    id: "progress",
    liveData: true,
    title: "Plan day — solo (today's tasks)",
    group: "plans",
    render: "fixture",
    width: 390,
    height: 844,
    files: [
      `${M}/progress/progress-client.tsx`,
      `${M}/progress/task-list.tsx`,
      `${M}/progress/day-carousel.tsx`,
      `${M}/progress/plan-overflow-menu.tsx`,
    ],
  },
  {
    id: "community",
    liveData: true,
    title: "Community feed",
    group: "member",
    render: "fixture",
    width: 390,
    height: 844,
    files: [
      `${M}/community/community-client.tsx`,
      `${M}/community/activity-feed.tsx`,
      `${M}/community/add-friends.tsx`,
      `${M}/community/friend-requests.tsx`,
      `${M}/community/people-you-may-know.tsx`,
    ],
  },
  {
    id: "friends",
    liveData: true,
    title: "Friends list",
    group: "member",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/community/friends/friends-list-client.tsx`],
  },
  {
    id: "friend-profile",
    liveData: true,
    title: "Someone else's profile",
    group: "member",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/community/[handle]/profile-client.tsx`],
  },
  {
    id: "profile",
    liveData: true,
    title: "My profile",
    group: "member",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/profile/profile-client.tsx`, `${M}/profile/badge-grid.tsx`],
  },
  {
    id: "settings",
    liveData: true,
    title: "Profile settings",
    group: "member",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/profile/settings/settings-client.tsx`],
  },
  {
    id: "admin",
    liveData: true,
    title: "Admin panel",
    group: "member",
    render: "fixture",
    width: 390,
    height: 844,
    files: [
      `${M}/admin/admin-client.tsx`,
      `${M}/admin/admin-stats.tsx`,
      `${M}/admin/admin-users-table.tsx`,
      `${M}/admin/admin-streak-table.tsx`,
      `${M}/admin/broadcast-form.tsx`,
    ],
  },

  // ── Popups ──
  {
    id: "task-devotional",
    title: "Task — devotional reading",
    group: "popups",
    render: "fixture",
    width: 390,
    height: 844,
    files: [
      `${M}/progress/task-detail.tsx`,
      `${M}/progress/renderers/sectioned-content.tsx`,
      `${M}/progress/renderers/reflection-input.tsx`,
    ],
  },
  {
    id: "task-scripture",
    title: "Task — scripture reading",
    group: "popups",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/progress/task-detail.tsx`, `${M}/progress/renderers/bilingual-passage.tsx`],
  },
  {
    id: "task-mood",
    title: "Task — mood log",
    group: "popups",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/progress/renderers/mood-log.tsx`],
  },
  {
    id: "task-exercise",
    title: "Task — exercise log",
    group: "popups",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/progress/renderers/exercise-log.tsx`],
  },
  {
    id: "block-celebration",
    title: "Block finished — badge",
    group: "popups",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/dashboard/block-celebration.tsx`],
  },
  {
    id: "share-profile",
    title: "Share profile (QR)",
    group: "popups",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/profile/share-profile-modal.tsx`],
  },
  {
    id: "avatar-crop",
    title: "Crop avatar",
    group: "popups",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/profile/settings/avatar-crop-modal.tsx`],
  },
  {
    id: "notifications",
    liveData: true,
    title: "Notifications panel",
    group: "popups",
    render: "fixture",
    width: 390,
    height: 844,
    files: ["src/features/notifications/notification-panel.tsx"],
  },
  {
    id: "dashboard-empty",
    title: "Dashboard — no plan yet",
    group: "plans",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/dashboard/dashboard-client.tsx`],
  },
  {
    id: "plans",
    liveData: true,
    title: "Your blocks (plans list)",
    group: "plans",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/plans/plans-client.tsx`],
  },
  {
    id: "plans-completed",
    liveData: true,
    title: "Your blocks — completed tab",
    group: "plans",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/plans/plans-client.tsx`],
  },
  {
    id: "plan-group",
    liveData: true,
    title: "Group plan day (members + invite)",
    group: "plans",
    render: "fixture",
    width: 390,
    height: 844,
    files: [
      `${M}/progress/progress-client.tsx`,
      `${M}/plans/plan-day-social.tsx`,
      `${M}/progress/plan-overflow-menu.tsx`,
    ],
  },
  {
    id: "plan-discussion",
    title: "Group discussion (“Talk it out”)",
    group: "plans",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/progress/group-discussion-task.tsx`, `${M}/plans/plan-day-social.tsx`],
  },
  {
    id: "join-plan",
    title: "Join a plan (invite link)",
    group: "plans",
    render: "fixture",
    width: 390,
    height: 844,
    files: [
      "app/[locale]/join/[inviteCode]/join-plan-client.tsx",
      "app/[locale]/join/[inviteCode]/page.tsx",
    ],
  },
  {
    id: "join-plan-expired",
    title: "Join a plan — invite expired",
    group: "plans",
    render: "fixture",
    width: 390,
    height: 844,
    files: ["app/[locale]/join/[inviteCode]/join-plan-client.tsx"],
  },
  {
    id: "join-plan-removed",
    title: "Join a plan — removed by the creator",
    group: "plans",
    render: "fixture",
    width: 390,
    height: 844,
    files: ["app/[locale]/join/[inviteCode]/join-plan-client.tsx"],
  },
  {
    id: "join-plan-error",
    title: "Join a plan — something went wrong",
    group: "plans",
    render: "fixture",
    width: 390,
    height: 844,
    files: ["app/[locale]/join/[inviteCode]/join-plan-client.tsx"],
  },
  {
    id: "ui-lab",
    title: "UI lab (design previews)",
    group: "plans",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/ui-lab/ui-lab-client.tsx`, `${M}/ui-lab/page.tsx`],
  },
  {
    id: "plan-create",
    title: "Start a plan (dialog)",
    group: "popups",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/plans/plans-client.tsx`],
  },
  {
    id: "plan-leave",
    title: "Leave a shared block (confirm)",
    group: "popups",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/plans/plans-client.tsx`],
  },
  {
    id: "plan-stop",
    title: "Stop this block — confirm pop-up",
    group: "popups",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/progress/plan-overflow-menu.tsx`],
  },
  {
    id: "plan-menu",
    title: "Block actions menu (invite, delete)",
    group: "popups",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/progress/plan-overflow-menu.tsx`],
  },
  {
    id: "plan-members",
    title: "Plan members & add friends",
    group: "popups",
    render: "fixture",
    width: 390,
    height: 844,
    files: [`${M}/plans/plan-day-social.tsx`],
  },
];

export function frameUrl(f: FrameDef, locale: "en" | "zh", liveData = false): string {
  const parts = [f.query, liveData && f.liveData ? "data=live" : ""].filter(Boolean);
  const q = parts.length ? `?${parts.join("&")}` : "";
  if (f.render === "route") return `${f.route!.replace("{locale}", locale)}${q}`;
  return `/${locale}/dev/frame/${f.frameId ?? f.id}${q}`;
}
