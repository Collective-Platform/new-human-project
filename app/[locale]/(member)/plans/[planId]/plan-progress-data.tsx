import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";
import { getProgressForUser } from "@/src/features/progress";
import {
  getPlanCurrentDay,
  getPlanDiscussion,
  getPlanForMember,
  getPlanMembersForDay,
} from "@/src/features/plans/queries";
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
    planState.plan.startedAt.getTime(),
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
  const [initialData, socialData] = await Promise.all([initialDataPromise, socialDataPromise]);
  return (
    <ProgressClient
      locale={locale}
      initialData={initialData}
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
