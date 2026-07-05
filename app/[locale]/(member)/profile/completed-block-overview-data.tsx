import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";
import { getBlockDashboardForUser } from "@/src/features/dashboard";
import { getBlockFinalStreak } from "@/src/features/progress";
import { BLOCK_LENGTH_DAYS, getBlockStart } from "@/src/lib/program-gate";
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
  const blockStart = getBlockStart(user.onboardedAt, blockNumber, timezone);
  const blockEnd = new Date(blockStart.getTime() + BLOCK_LENGTH_DAYS * 86_400_000);

  const finalStreak = await getBlockFinalStreak(user.id, blockStart, blockEnd, timezone);
  const data = await getBlockDashboardForUser(
    user.id,
    blockNumber,
    blockStart.getTime(),
    finalStreak,
  );

  return <CompletedBlockOverviewClient data={data} blockNumber={blockNumber} locale={locale} />;
}
