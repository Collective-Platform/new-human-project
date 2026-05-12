import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { FoundationCard } from "./dashboard/foundation-card";
import { DashboardSkeleton } from "./dashboard/dashboard-skeleton";
import { DashboardData } from "./dashboard/dashboard-data";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData locale={locale as "en" | "zh"}>
        <FoundationCard />
      </DashboardData>
    </Suspense>
  );
}
