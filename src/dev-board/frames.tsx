"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BottomNav } from "@/app/[locale]/(member)/bottom-nav";
import { NavVisibilityProvider } from "@/app/[locale]/(member)/nav-visibility";
import { ProgressProvider } from "@/src/features/progress/progress-context";
import type { HomeDashboardData } from "@/src/features/dashboard";
import { DashboardClient } from "@/app/[locale]/(member)/dashboard/dashboard-client";
import { FoundationCard } from "@/app/[locale]/(member)/dashboard/foundation-card";
import { BlockCelebration } from "@/app/[locale]/(member)/dashboard/block-celebration";
import { ProgressClient } from "@/app/[locale]/(member)/progress/progress-client";
import { GroupDiscussionTask } from "@/app/[locale]/(member)/progress/group-discussion-task";
import { PlansClient } from "@/app/[locale]/(member)/plans/plans-client";
import { JoinPlanClient } from "@/app/[locale]/join/[inviteCode]/join-plan-client";
import { UiLabClient } from "@/app/[locale]/(member)/ui-lab/ui-lab-client";
import { TaskDetail } from "@/app/[locale]/(member)/progress/task-detail";
import { CommunityClient } from "@/app/[locale]/(member)/community/community-client";
import { FriendsListClient } from "@/app/[locale]/(member)/community/friends/friends-list-client";
import { ProfileClient as FriendProfileClient } from "@/app/[locale]/(member)/community/[handle]/profile-client";
import { ProfileClient } from "@/app/[locale]/(member)/profile/profile-client";
import { SettingsClient } from "@/app/[locale]/(member)/profile/settings/settings-client";
import { AvatarCropModal } from "@/app/[locale]/(member)/profile/settings/avatar-crop-modal";
import { ShareProfileModal } from "@/app/[locale]/(member)/profile/share-profile-modal";
import { AdminClient } from "@/app/[locale]/(member)/admin/admin-client";
import { NotificationPanel } from "@/src/features/notifications/notification-panel";
import { FrameBridge } from "./frame-bridge";
import type { BoardFixtures } from "./fixtures";

const noop = () => {};
const noopAsync = async () => {};

/** The member app's outer shell (header strip, scroll area, bottom tabs). */
export function Shell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  const locale = useLocale();
  return (
    <ProgressProvider>
      <NavVisibilityProvider>
        <div className="flex flex-col h-[100dvh] bg-surface overflow-hidden">
          <header className="bg-white">
            <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
              <div className="flex items-center font-bold text-xl text-primary zh:text-2xl zh:font-kaiti-sc-black">
                {locale === "zh" ? "节奏" : "Rhythm"}
              </div>
            </div>
          </header>
          <main className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain mx-auto w-full max-w-3xl">
            {children}
          </main>
          {nav && <BottomNav />}
        </div>
      </NavVisibilityProvider>
    </ProgressProvider>
  );
}

/**
 * Clicks a button inside once, so a popup that opens on tap shows already open.
 * Pass `thenSelector` to click a second control after the first one opens
 * (for example a menu item inside a menu).
 */
function OpenOnMount({
  children,
  selector = "button",
  thenSelector,
}: {
  children: ReactNode;
  selector?: string;
  thenSelector?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const first = setTimeout(() => ref.current?.querySelector<HTMLElement>(selector)?.click(), 400);
    const second = thenSelector
      ? setTimeout(() => ref.current?.querySelector<HTMLElement>(thenSelector)?.click(), 700)
      : undefined;
    return () => {
      clearTimeout(first);
      if (second) clearTimeout(second);
    };
  }, [selector, thenSelector]);
  return <div ref={ref}>{children}</div>;
}

/** Opens a popup by clicking the button with a translated label (plans namespace). */
function OpenByLabel({
  labelKey,
  thenSelector,
  children,
}: {
  labelKey: string;
  thenSelector?: string;
  children: ReactNode;
}) {
  const t = useTranslations("plans");
  return (
    <OpenOnMount
      selector={`button[aria-label=${JSON.stringify(t(labelKey as never))}]`}
      thenSelector={thenSelector}
    >
      {children}
    </OpenOnMount>
  );
}

const AVAILABLE_BLOCKS = [1, 2, 3, 4, 5, 6];

const EMPTY_HOME: HomeDashboardData = {
  radar: { mental: 0, emotional: 0, physical: 0 },
  streak: 0,
  calendar: [],
  windowStartDate: "1970-01-01",
  emotionBreakdown: {},
  activityLast25: Array.from({ length: 25 }, (_, i) => ({ day: i + 1, totalMinutes: 0 })),
  earnedBadge: null,
};

function PlanDay({
  fx,
  locale,
  open,
}: {
  fx: BoardFixtures;
  locale: string;
  open?: "menu" | "members" | "leave" | "stop" | "none";
}) {
  const isMember = open === "leave";
  const solo = open === "stop";
  const group = {
    ...fx.progress,
    planId: "demo-group",
    blockNumber: 5,
  };
  const client = (
    <ProgressClient
      locale={locale}
      initialData={group}
      planControls={{ isGroup: !solo, isOwner: !isMember }}
      planSocial={{
        selfUserId: 1,
        isOwner: !isMember,
        inviteCode: "DEMO1234",
        initialData: { members: fx.members, discussion: fx.discussion },
      }}
    />
  );
  return (
    <Shell>
      {open === "menu" ? (
        <OpenByLabel labelKey="moreActions">{client}</OpenByLabel>
      ) : open === "leave" ? (
        <OpenByLabel labelKey="moreActions" thenSelector='[role="menuitem"]:last-of-type'>
          {client}
        </OpenByLabel>
      ) : open === "stop" ? (
        <OpenByLabel labelKey="moreActions" thenSelector='[role="menuitem"]:last-of-type'>
          {client}
        </OpenByLabel>
      ) : open === "members" ? (
        <OpenOnMount selector='button[aria-haspopup="dialog"]'>{client}</OpenOnMount>
      ) : (
        client
      )}
    </Shell>
  );
}

function Popup({
  task,
  fx,
  locale,
}: {
  task: NonNullable<BoardFixtures["samples"][keyof BoardFixtures["samples"]]>;
  fx: BoardFixtures;
  locale: string;
}) {
  return (
    <Shell nav={false}>
      <TaskDetail
        task={task}
        locale={locale}
        blockNumber={1}
        dayNumber={fx.progress.currentDay}
        onCompleteAction={noopAsync}
        onCloseAction={noop}
        categoryTasks={[task]}
        onNavigateAction={noop}
      />
    </Shell>
  );
}

function Missing({ what }: { what: string }) {
  return (
    <div className="p-6 text-sm text-foreground/60">
      No sample {what} found in the program content.
    </div>
  );
}

function Body({ id, fx, locale }: { id: string; fx: BoardFixtures; locale: string }) {
  switch (id) {
    case "dashboard":
      return (
        <Shell>
          <DashboardClient
            data={fx.dashboard}
            plans={fx.plans.filter((p) => !p.completedAt)}
            locale={locale === "zh" ? "zh" : "en"}
          >
            <FoundationCard />
          </DashboardClient>
        </Shell>
      );
    case "dashboard-empty":
      return (
        <Shell>
          <DashboardClient data={EMPTY_HOME} plans={[]} locale={locale === "zh" ? "zh" : "en"}>
            <FoundationCard />
          </DashboardClient>
        </Shell>
      );
    case "plans":
    case "plans-completed":
      return (
        <Shell>
          <PlansClient
            locale={locale === "zh" ? "zh" : "en"}
            plans={fx.plans}
            availableBlocks={AVAILABLE_BLOCKS}
            initialTab={id === "plans" ? "active" : "completed"}
          />
        </Shell>
      );
    case "plan-create":
      return (
        <Shell>
          <OpenByLabel labelKey="startPlan">
            <PlansClient
              locale={locale === "zh" ? "zh" : "en"}
              plans={fx.plans}
              availableBlocks={AVAILABLE_BLOCKS}
              initialTab="active"
            />
          </OpenByLabel>
        </Shell>
      );
    case "plan-leave":
      return <PlanDay fx={fx} locale={locale} open="leave" />;
    case "plan-group":
      return <PlanDay fx={fx} locale={locale} />;
    case "plan-stop":
      return <PlanDay fx={fx} locale={locale} open="stop" />;
    case "plan-menu":
      return <PlanDay fx={fx} locale={locale} open="menu" />;
    case "plan-members":
      return <PlanDay fx={fx} locale={locale} open="members" />;
    case "plan-discussion":
      return (
        <Shell nav={false}>
          <GroupDiscussionTask
            locale={locale === "zh" ? "zh" : "en"}
            planId="demo-group"
            selectedDay={fx.progress.currentDay}
            selfUserId={1}
            isOwner
            initialData={{ members: fx.members, discussion: fx.discussion }}
            blockNumber={5}
            categoryTasks={[
              {
                id: "group-discussion-demo-group",
                category: "Mental",
                taskType: "group_discussion",
                name: "Talk it out",
                content: null,
                completed: false,
                completionData: null,
              },
            ]}
            onNavigateAction={noop}
            onCloseAction={noop}
          />
        </Shell>
      );
    case "join-plan":
    case "join-plan-expired":
    case "join-plan-removed":
    case "join-plan-error":
      return (
        <Shell nav={false}>
          <JoinPlanClient
            inviteCode="DEMO1234"
            expired={id === "join-plan-expired"}
            initialNotice={
              id === "join-plan-removed" ? "kicked" : id === "join-plan-error" ? "failed" : null
            }
          />
        </Shell>
      );
    case "ui-lab":
      return (
        <Shell>
          <UiLabClient locale={locale === "zh" ? "zh" : "en"} />
        </Shell>
      );
    case "progress":
      return (
        <Shell>
          <ProgressClient
            locale={locale}
            initialData={{ ...fx.progress, planId: "demo-solo", blockNumber: 3 }}
            planControls={{ isGroup: false, isOwner: true }}
          />
        </Shell>
      );
    case "community":
      return (
        <Shell>
          <CommunityClient
            selfUserId={1}
            initialData={{
              friends: fx.people,
              requests: [
                {
                  requestId: "r1",
                  userId: 5,
                  displayName: "Priya N.",
                  searchHandle: "priya",
                  avatarUrl: null,
                  createdAt: fx.notifications[0].sentAt,
                },
              ],
              suggestions: [
                {
                  id: 6,
                  displayName: "Jonah Wee",
                  searchHandle: "jonah",
                  avatarUrl: null,
                  mutualCount: 2,
                  connectionStatus: "none",
                },
              ],
              feed: fx.feed,
            }}
          />
        </Shell>
      );
    case "friends":
      return (
        <Shell>
          <FriendsListClient friends={fx.people} />
        </Shell>
      );
    case "friend-profile":
      return (
        <Shell>
          <FriendProfileClient
            profile={{ id: 2, displayName: "Grace Lim", searchHandle: "grace", avatarUrl: null }}
            activities={fx.feed}
            friends={fx.people.map((p) => ({ ...p, connectionStatus: "none" as const }))}
            connectionStatus="none"
            selfUserId={1}
          />
        </Shell>
      );
    case "profile":
      return (
        <Shell>
          <ProfileClient
            initialData={fx.profile}
            friendCount={fx.people.length}
            activities={fx.feed}
            selfUserId={1}
          />
        </Shell>
      );
    case "settings":
      return (
        <Shell>
          <SettingsClient />
        </Shell>
      );
    case "admin":
      return (
        <Shell>
          <AdminClient
            locale={locale}
            stats={fx.admin.stats}
            users={fx.admin.users}
            streaks={fx.admin.streaks}
          />
        </Shell>
      );
    case "task-devotional":
      return fx.samples.devotional ? (
        <Popup task={fx.samples.devotional} fx={fx} locale={locale} />
      ) : (
        <Missing what="devotional" />
      );
    case "task-scripture":
      return fx.samples.scripture ? (
        <Popup task={fx.samples.scripture} fx={fx} locale={locale} />
      ) : (
        <Missing what="scripture reading" />
      );
    case "task-mood":
      return fx.samples.mood ? (
        <Popup task={fx.samples.mood} fx={fx} locale={locale} />
      ) : (
        <Missing what="mood log" />
      );
    case "task-exercise":
      return fx.samples.exercise ? (
        <Popup task={fx.samples.exercise} fx={fx} locale={locale} />
      ) : (
        <Missing what="exercise" />
      );
    case "block-celebration":
      return (
        <Shell>
          <BlockCelebration badge={fx.badge} onDismissAction={noop} />
        </Shell>
      );
    case "share-profile":
      return (
        <Shell>
          <ShareProfileModal handle="sample_member" isOpen onCloseAction={noop} />
        </Shell>
      );
    case "avatar-crop":
      return (
        <Shell nav={false}>
          <AvatarCropModal imageSrc="/icons/rhythm-512x512.png" onConfirm={noop} onCancel={noop} />
        </Shell>
      );
    case "notifications":
      return (
        <Shell>
          <div className="flex justify-end p-3">
            <OpenOnMount>
              <NotificationPanel
                unreadCount={1}
                notifications={fx.notifications.map((n) => ({
                  ...n,
                  sentAt: new Date(n.sentAt),
                  readAt: n.readAt ? new Date(n.readAt) : null,
                }))}
              />
            </OpenOnMount>
          </div>
        </Shell>
      );
    default:
      return <Missing what={id} />;
  }
}

const STUBS = (fx: BoardFixtures) => ({
  "/api/profile": fx.profile,
  "/api/plans/demo-group/day": { members: fx.members, discussion: fx.discussion },
});

export function FixtureFrame({
  id,
  fx,
  locale,
}: {
  id: string;
  fx: BoardFixtures;
  locale: string;
}) {
  // Sample frames draw on the client only: some components read window, dates
  // and time zones, which differ between server and browser.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <>
      <FrameBridge stubs={STUBS(fx)} />
      {ready && <Body id={id} fx={fx} locale={locale} />}
    </>
  );
}

/** Notifications panel opened, with real rows (local DB mode). */
export function LiveNotificationsFrame({
  notifications,
  unreadCount,
}: {
  notifications: {
    id: string;
    type: string;
    title: string | null;
    body: string | null;
    sentAt: string;
    readAt: string | null;
  }[];
  unreadCount: number;
}) {
  return (
    <>
      <FrameBridge />
      <Shell>
        <div className="flex justify-end p-3">
          <OpenOnMount>
            <NotificationPanel
              unreadCount={unreadCount}
              notifications={notifications.map((n) => ({
                ...n,
                sentAt: new Date(n.sentAt),
                readAt: n.readAt ? new Date(n.readAt) : null,
              }))}
            />
          </OpenOnMount>
        </div>
      </Shell>
    </>
  );
}
