import { cookies } from "next/headers";
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
  const cookieStore = await cookies();
  const rawTz = cookieStore.get("tz")?.value ?? "UTC";
  const timezone = decodeURIComponent(rawTz);
  const initialData = await getDashboardForUser(
    user.id,
    user.onboardedAt.getTime(),
    30,
    locale,
    currentDay,
    timezone,
  );
  return (
    <DashboardClient
      initialData={initialData}
    >
      {children}
    </DashboardClient>
  );
}
