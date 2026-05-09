import { getSessionUser } from "@/src/features/auth";
import { getDashboardForUser, getCurrentDay } from "@/src/features/dashboard";
import { DashboardClient } from "./dashboard-client";

export async function DashboardData({
  locale,
  children,
}: {
  locale: "en" | "zh";
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user?.onboardedAt) return null;
  const currentDay = getCurrentDay(user.onboardedAt);
  const initialData = await getDashboardForUser(
    user.id,
    user.onboardedAt,
    30,
    locale,
    currentDay,
  );
  return <DashboardClient initialData={initialData}>{children}</DashboardClient>;
}
