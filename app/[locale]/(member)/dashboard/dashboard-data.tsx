import { cookies } from "next/headers";
import { getSessionUser } from "@/src/features/auth";
import { getDashboardForUser } from "@/src/features/dashboard";
import { DashboardClient } from "./dashboard-client";
import { getActiveBlock } from "@/src/lib/program-gate";

export async function DashboardData({
  locale,
  children,
}: {
  locale: "en" | "zh";
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user?.onboardedAt) return null;
  const cookieStore = await cookies();
  const rawTz = cookieStore.get("tz")?.value ?? "UTC";
  const timezone = decodeURIComponent(rawTz);
  const { blockNumber, blockStart, currentDay } = getActiveBlock(
    user.onboardedAt,
    new Date(),
    timezone,
  );
  const initialData = await getDashboardForUser(
    user.id,
    blockNumber,
    blockStart.getTime(),
    locale,
    currentDay,
    timezone,
  );
  return <DashboardClient initialData={initialData}>{children}</DashboardClient>;
}
