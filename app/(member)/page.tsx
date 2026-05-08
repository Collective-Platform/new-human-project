import { Suspense } from "react";
import { cookies } from "next/headers";
import { getSessionUser } from "@/src/features/auth";
import { getCurrentDay } from "@/src/features/dashboard";
import { FoundationCard } from "./dashboard/foundation-card";
import { DashboardSkeleton } from "./dashboard/dashboard-skeleton";
import { DashboardData } from "./dashboard/dashboard-data";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user?.onboardedAt) return null;

  const currentDay = getCurrentDay(user.onboardedAt);

  const store = await cookies();
  const locale = (store.get("locale")?.value === "zh" ? "zh" : "en") as
    | "en"
    | "zh";

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData
        userId={user.id}
        onboardedAt={user.onboardedAt}
        currentDay={currentDay}
        locale={locale}
      >
        <FoundationCard />
      </DashboardData>
    </Suspense>
  );
}
