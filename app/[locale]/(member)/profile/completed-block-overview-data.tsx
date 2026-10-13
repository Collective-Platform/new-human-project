import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";
import { getBlockDashboardForUser } from "@/src/features/dashboard";
import { getBlockFinalStreak } from "@/src/features/progress";
import { getBlockStart, getBlockWindowEnd } from "@/src/lib/program-gate";
import { getAttempts } from "@/src/features/progress/block-attempts";
import { CompletedBlockOverviewClient } from "./completed-block-overview-client";

export async function CompletedBlockOverviewData({
  locale,
  blockNumber,
}: {
  locale: "en" | "zh";
  blockNumber: number;
}) {
  const user = await getSessionUser();
  if (!user?.onboardedAt) redirect(`/${locale}/onboarding`);

  const cookieStore = await cookies();
  const timezone = decodeURIComponent(cookieStore.get("tz")?.value ?? "UTC");
  // getBlockStart returns a UTC-midnight marker so the streak ::date cast and calendar arithmetic align.
  const attempts = await getAttempts(user.id);
  const now = new Date();
  const blockStart = getBlockStart(user.onboardedAt, attempts, blockNumber, timezone);
  const blockEnd = getBlockWindowEnd(user.onboardedAt, attempts, blockNumber, now, timezone);

  const finalStreak = await getBlockFinalStreak(user.id, blockStart, blockEnd, timezone);
  const data = await getBlockDashboardForUser(
    user.id,
    blockNumber,
    blockStart.getTime(),
    finalStreak,
  );

  return <CompletedBlockOverviewClient data={data} blockNumber={blockNumber} locale={locale} />;
}
