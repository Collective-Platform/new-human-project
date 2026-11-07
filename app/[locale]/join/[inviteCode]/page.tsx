import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { getSessionUser } from "@/src/features/auth";
import {
  getPlanByInviteCode,
  getPlanCurrentDay,
  getPlanMemberStatus,
} from "@/src/features/plans/queries";
import { withReturnPath } from "@/src/lib/return-path";
import { JoinPlanClient } from "./join-plan-client";

type JoinPlanPageProps = {
  params: Promise<{ locale: string; inviteCode: string }>;
};

export default function JoinPlanPage({ params }: JoinPlanPageProps) {
  return (
    <Suspense fallback={null}>
      <JoinPlanContent params={params} />
    </Suspense>
  );
}

async function JoinPlanContent({ params }: JoinPlanPageProps) {
  const { locale, inviteCode } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  // Bring the visitor back to this invite after they log in, sign up or finish onboarding.
  const invitePath = `/join/${inviteCode}`;
  if (!user) redirect(withReturnPath(`/${locale}/login`, invitePath));
  if (!user.onboardedAt) redirect(withReturnPath(`/${locale}/onboarding`, invitePath));
  const plan = await getPlanByInviteCode(inviteCode);
  if (!plan) redirect(`/${locale}/progress`);
  const timezone = decodeURIComponent((await cookies()).get("tz")?.value ?? "UTC");
  const kicked = (await getPlanMemberStatus(plan.id, user.id)) === "kicked";
  return (
    <JoinPlanClient
      inviteCode={inviteCode}
      initialNotice={kicked ? "kicked" : null}
      expired={getPlanCurrentDay(plan.startedAt, timezone) >= 25}
    />
  );
}
