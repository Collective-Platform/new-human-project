import { getSessionUser } from "@/src/features/auth";
import { getHomeDashboard } from "@/src/features/dashboard";
import { DashboardClient } from "./dashboard-client";
import { getPlansForUser } from "@/src/features/plans/queries";
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
  const allPlans = await getPlansForUser(user.id);
  const activePlans = allPlans.filter((plan) => !plan.completedAt);
  // The Foundation intro is only for members in their first block, or with no block yet.
  // Anyone with another block, or a finished one, has seen it and does not need it again.
  const showFoundation =
    allPlans.length === 0 ||
    (allPlans.length === 1 && allPlans[0].blockNumber === 1 && !allPlans[0].completedAt);
  const data = await getHomeDashboard(
    user.id,
    activePlans.map((plan) => ({
      id: plan.id,
      blockNumber: plan.blockNumber,
      startMs: plan.startedAt.getTime(),
    })),
    timezone,
  );
  return (
    <DashboardClient
      data={data}
      plans={activePlans.map((plan) => ({
        id: plan.id,
        blockNumber: plan.blockNumber,
        title: plan.title,
      }))}
      locale={locale}
    >
      {showFoundation ? children : null}
    </DashboardClient>
  );
}
