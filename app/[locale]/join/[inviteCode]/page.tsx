import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSessionUser } from "@/src/features/auth";
import { getPlanByInviteCode, getPlanCurrentDay } from "@/src/features/plans/queries";
import { JoinPlanClient } from "./join-plan-client";

export default async function JoinPlanPage({
  params,
}: {
  params: Promise<{ locale: string; inviteCode: string }>;
}) {
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
