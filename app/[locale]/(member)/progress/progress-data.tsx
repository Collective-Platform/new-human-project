import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";
import { getCurrentDay } from "@/src/features/dashboard";
import { getProgressForUser } from "@/src/features/progress";
import { ProgressClient } from "./progress-client";

export async function ProgressData({ locale }: { locale: "en" | "zh" }) {
  const user = await getSessionUser();
  if (!user?.onboardedAt) redirect(`/${locale}/onboarding`);
  const currentDay = getCurrentDay(user.onboardedAt);
  const initialData = await getProgressForUser(
    user.id,
    user.onboardedAt.getTime(),
    null,
    locale,
    currentDay,
  );
  return <ProgressClient locale={locale} initialData={initialData} />;
}
