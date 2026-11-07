import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";
import { getProgressForUser } from "@/src/features/progress";
import {
  getPlanCurrentDay,
  getPlanDayDate,
  getPlanDiscussion,
  getPlanForMember,
  getPlanMembersForDay,
} from "@/src/features/plans/queries";
import { hasCopiedPastLogs } from "@/src/features/tasks/shared-logs";
import { ProgressClient } from "../../progress/progress-client";

export async function PlanProgressData({
  locale,
  planId,
  initialDay,
}: {
  locale: "en" | "zh";
  planId: string;
  initialDay?: number;
}) {
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  const planState = await getPlanForMember(planId, user.id);
  if (!planState) notFound();

  const cookieStore = await cookies();
  const timezone = decodeURIComponent(cookieStore.get("tz")?.value ?? "UTC");
  const currentDay = getPlanCurrentDay(planState.plan.startedAt, timezone);
  const selectedDay = Math.min(Math.max(initialDay ?? currentDay, 1), 25);
  const initialDataPromise = getProgressForUser(
    user.id,
    // Same convention as the legacy path: a UTC-midnight marker of the member's local start date.
    getPlanDayDate(planState.plan.startedAt, 1, timezone).getTime(),
    selectedDay,
    locale,
    currentDay,
    planState.plan.blockNumber,
    planId,
  );
  const socialDataPromise = planState.plan.isGroup
    ? Promise.all([
        getPlanMembersForDay(planId, selectedDay),
        getPlanDiscussion(planId, selectedDay),
      ])
    : Promise.resolve(undefined);
  const [initialData, socialData, showCopiedLogsNotice] = await Promise.all([
    initialDataPromise,
    socialDataPromise,
    hasCopiedPastLogs(user.id, planId),
  ]);
  return (
    <ProgressClient
      locale={locale}
      initialData={initialData}
      dayFromLink={initialDay !== undefined}
      showCopiedLogsNotice={showCopiedLogsNotice}
      planControls={{
        isGroup: planState.plan.isGroup,
        isOwner: planState.membership.role === "owner",
      }}
      planSocial={
        socialData
          ? {
              selfUserId: user.id,
              isOwner: planState.membership.role === "owner",
              inviteCode: planState.plan.inviteCode,
              initialData: { members: socialData[0], discussion: socialData[1] },
            }
          : undefined
      }
    />
  );
}
