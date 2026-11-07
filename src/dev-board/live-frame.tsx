import { Suspense, type ReactNode } from "react";
import { and, ne, isNotNull } from "drizzle-orm";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { isAdmin } from "@/src/features/auth";
import {
  getNotificationsForUser,
  getUnreadSocialCount,
} from "@/src/features/notifications/queries";
import { DashboardData } from "@/app/[locale]/(member)/dashboard/dashboard-data";
import { FoundationCard } from "@/app/[locale]/(member)/dashboard/foundation-card";
import { PlansData } from "@/app/[locale]/(member)/plans/plans-data";
import { PlanProgressData } from "@/app/[locale]/(member)/plans/[planId]/plan-progress-data";
import { getPlansForUser } from "@/src/features/plans/queries";
import { CommunityData } from "@/app/[locale]/(member)/community/community-data";
import { FriendsData } from "@/app/[locale]/(member)/community/friends/friends-data";
import { ProfileData as FriendProfileData } from "@/app/[locale]/(member)/community/[handle]/profile-data";
import { ProfileData } from "@/app/[locale]/(member)/profile/profile-data";
import { SettingsClient } from "@/app/[locale]/(member)/profile/settings/settings-client";
import { AdminData } from "@/app/[locale]/(member)/admin/admin-data";
import { getBoardUser } from "./board-user";
import { LiveErrorBoundary } from "./error-boundary";
import { FrameBridge } from "./frame-bridge";
import { LiveNotificationsFrame, Shell } from "./frames";

// "Local DB data" mode. Runs the app's own data components unchanged, as the
// member picked in the board's top bar. Read-only: the bridge blocks all saves,
// and the board refuses to run unless the database is on this computer.

function Note({ children }: { children: ReactNode }) {
  return <div className="p-6 text-sm text-foreground/70">{children}</div>;
}

export async function LiveFrame({ id, locale }: { id: string; locale: "en" | "zh" }) {
  const me = await getBoardUser();
  if (!me) {
    return (
      <Note>
        Local DB mode is off or no member is picked. Use “Data” in the board's top bar. It works
        only when DATABASE_PROVIDER=local.
      </Note>
    );
  }

  let node: ReactNode;
  switch (id) {
    case "dashboard":
      node = (
        <DashboardData locale={locale}>
          <FoundationCard />
        </DashboardData>
      );
      break;
    case "plans":
    case "plans-completed":
      node = <PlansData locale={locale} initialTab={id === "plans" ? "active" : "completed"} />;
      break;
    case "progress":
    case "plan-group": {
      // Solo view: the member's first solo plan. Group view: their first shared plan.
      const mine = (await getPlansForUser(me.id)).filter((p) => !p.completedAt);
      const plan = mine.find((p) => p.isGroup === (id === "plan-group"));
      node = plan ? (
        <PlanProgressData locale={locale} planId={plan.id} />
      ) : (
        <Note>
          This member has no {id === "plan-group" ? "shared" : "solo"} plan yet. Start one in the
          app or pick another member.
        </Note>
      );
      break;
    }
    case "community":
      node = <CommunityData />;
      break;
    case "friends":
      node = <FriendsData />;
      break;
    case "friend-profile": {
      const [other] = await db
        .select({ handle: users.searchHandle })
        .from(users)
        .where(and(ne(users.id, me.id), isNotNull(users.searchHandle)))
        .limit(1);
      const handle = other?.handle ?? me.searchHandle;
      node = handle ? (
        <FriendProfileData handle={handle} />
      ) : (
        <Note>No other member with a username yet.</Note>
      );
      break;
    }
    case "profile":
      node = <ProfileData />;
      break;
    case "settings":
      node = <SettingsClient />;
      break;
    case "admin":
      node = isAdmin(me) ? (
        <AdminData locale={locale} />
      ) : (
        <Note>{me.email} is not an admin. Pick an admin member.</Note>
      );
      break;
    case "notifications": {
      const rows = await getNotificationsForUser(me.id);
      return (
        <LiveNotificationsFrame
          unreadCount={await getUnreadSocialCount(me.id)}
          notifications={rows.map((r) => ({
            id: String(r.id),
            type: r.type,
            title: r.title,
            body: r.body,
            sentAt: r.sentAt.toISOString(),
            readAt: r.readAt ? r.readAt.toISOString() : null,
          }))}
        />
      );
    }
    default:
      return null;
  }

  return (
    <>
      <FrameBridge />
      <Shell>
        <LiveErrorBoundary>
          <Suspense fallback={<Note>Loading from local database…</Note>}>{node}</Suspense>
        </LiveErrorBoundary>
      </Shell>
    </>
  );
}
