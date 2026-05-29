import { cookies } from "next/headers";
import { getSessionUser } from "@/src/features/auth";
import { getDashboardForUser, getCurrentDay } from "@/src/features/dashboard";
import { DashboardClient } from "./dashboard-client";
import { PROGRAM_BLOCK_START } from "@/src/lib/program-gate";

export async function DashboardData({
  locale,
  children,
}: {
  locale: "en" | "zh";
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user?.onboardedAt) return null;
  const effectiveStart =
    user.onboardedAt.getTime() < PROGRAM_BLOCK_START.getTime()
      ? PROGRAM_BLOCK_START
      : user.onboardedAt;
  const currentDay = getCurrentDay(effectiveStart);
  const cookieStore = await cookies();
  const rawTz = cookieStore.get("tz")?.value ?? "UTC";
  const timezone = decodeURIComponent(rawTz);
  const initialData = await getDashboardForUser(
    user.id,
    effectiveStart.getTime(),
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
