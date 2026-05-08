import { getDashboardForUser } from "@/src/features/dashboard";
import { DashboardClient } from "./dashboard-client";

export async function DashboardData({
  userId,
  onboardedAt,
  currentDay,
  locale,
  children,
}: {
  userId: number;
  onboardedAt: Date;
  currentDay: number;
  locale: "en" | "zh";
  children: React.ReactNode;
}) {
  const initialData = await getDashboardForUser(
    userId,
    onboardedAt,
    30,
    locale,
    currentDay,
  );
  return <DashboardClient initialData={initialData}>{children}</DashboardClient>;
}
