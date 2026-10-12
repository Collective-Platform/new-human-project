import { getSessionUser } from "@/src/features/auth";
import { getMaxContentBlock } from "@/src/features/content/program";
import { getPlansForUser } from "@/src/features/plans/queries";
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
  const plans = await getPlansForUser(user.id);
  return (
    <PlansClient
      locale={locale}
      plans={plans.map((plan) => ({
        ...plan,
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
