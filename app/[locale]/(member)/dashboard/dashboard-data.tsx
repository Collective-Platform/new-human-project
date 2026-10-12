import { getSessionUser } from "@/src/features/auth";
import { getDashboardForUser } from "@/src/features/dashboard";
import { getMaxContentBlock } from "@/src/features/content/program";
import { isBlockReleased, PROGRAM_DEFAULT_TZ } from "@/src/lib/program-gate";
import { DashboardClient } from "./dashboard-client";
import {
  getDashboardPlanForUser,
  getPlansForUser,
  getPlanCurrentDay,
} from "@/src/features/plans/queries";
import { cookies } from "next/headers";

export async function DashboardData({
  locale,
  children,
}: {
  locale: "en" | "zh";
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) return null;
  const cookieStore = await cookies();
  const rawTz = cookieStore.get("tz")?.value ?? "UTC";
  const timezone = decodeURIComponent(rawTz);
  const [dashboardPlan, plans] = await Promise.all([
    getDashboardPlanForUser(user.id),
    getPlansForUser(user.id),
  ]);
  const initialData = dashboardPlan
    ? await getDashboardForUser(
        user.id,
        dashboardPlan.id,
        dashboardPlan.blockNumber,
        dashboardPlan.startedAt.getTime(),
        locale,
        getPlanCurrentDay(dashboardPlan.startedAt, timezone),
        timezone,
      )
    : null;
  return (
    <DashboardClient
      initialData={initialData}
      plans={plans
        .filter((plan) => !plan.completedAt)
        .map((plan) => ({
          id: plan.id,
          blockNumber: plan.blockNumber,
          title: plan.title,
        }))}
      availableBlocks={Array.from({ length: getMaxContentBlock() }, (_, index) => index + 1).filter(
        (blockNumber) => isBlockReleased(blockNumber, new Date(), PROGRAM_DEFAULT_TZ),
      )}
      selectedPlanId={dashboardPlan?.id ?? null}
      locale={locale}
    >
      {children}
    </DashboardClient>
  );
}
