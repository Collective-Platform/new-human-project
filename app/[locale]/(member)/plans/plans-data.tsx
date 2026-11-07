import { cookies } from "next/headers";
import { getSessionUser } from "@/src/features/auth";
import { getMaxContentBlock } from "@/src/features/content/program";
import {
  getPlanCardProgress,
  getPlanFinalStreaks,
  getPlansForUser,
} from "@/src/features/plans/queries";
import { isBlockReleased, PROGRAM_DEFAULT_TZ } from "@/src/lib/program-gate";
import { PlansClient } from "./plans-client";

export async function PlansData({
  locale,
  initialTab,
}: {
  locale: "en" | "zh";
  initialTab: "active" | "completed";
}) {
  const user = await getSessionUser();
  if (!user) return null;
  const cookieStore = await cookies();
  const timezone = decodeURIComponent(cookieStore.get("tz")?.value ?? "UTC");
  const plans = await getPlansForUser(user.id);
  const activePlans = plans.filter((plan) => !plan.completedAt);
  const completedPlans = plans.filter((plan) => plan.completedAt);
  const [progress, finalStreaks] = await Promise.all([
    getPlanCardProgress(user.id, timezone, activePlans),
    getPlanFinalStreaks(
      user.id,
      completedPlans.map((plan) => plan.id),
      timezone,
    ),
  ]);
  return (
    <PlansClient
      locale={locale}
      plans={plans.map((plan) => ({
        ...plan,
        progress: progress.get(plan.id) ?? null,
        finalStreak: finalStreaks.get(plan.id) ?? 0,
        startedAt: plan.startedAt.toISOString(),
        completedAt: plan.completedAt?.toISOString() ?? null,
      }))}
      availableBlocks={Array.from({ length: getMaxContentBlock() }, (_, index) => index + 1).filter(
        (blockNumber) => isBlockReleased(blockNumber, new Date(), PROGRAM_DEFAULT_TZ),
      )}
      initialTab={initialTab}
    />
  );
}
