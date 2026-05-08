import { cookies } from "next/headers";
import { getSessionUser } from "@/src/features/auth";
import { getCurrentDay, getDashboardForUser } from "@/src/features/dashboard";
import { DashboardClient } from "./dashboard/dashboard-client";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user?.onboardedAt) return null;

  const currentDay = getCurrentDay(user.onboardedAt);

  const store = await cookies();
  const locale = (store.get("locale")?.value === "zh" ? "zh" : "en") as
    | "en"
    | "zh";

  const initialData = await getDashboardForUser(user.id, user.onboardedAt, 7, locale, currentDay);

  return <DashboardClient initialData={initialData} />;
}
