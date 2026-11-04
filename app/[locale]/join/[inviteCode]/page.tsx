import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { getSessionUser } from "@/src/features/auth";
import { getPlanByInviteCode, getPlanCurrentDay } from "@/src/features/plans/queries";
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
  if (!user) redirect(`/${locale}/login`);
  const plan = await getPlanByInviteCode(inviteCode);
  if (!plan) redirect(`/${locale}/progress`);
  const timezone = decodeURIComponent((await cookies()).get("tz")?.value ?? "UTC");
  return (
    <JoinPlanClient
      inviteCode={inviteCode}
      expired={getPlanCurrentDay(plan.startedAt, timezone) >= 25}
    />
  );
}
