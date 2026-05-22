import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";
import { getCurrentDay } from "@/src/features/dashboard";
import { getProgressForUser } from "@/src/features/progress";
import { ProgressClient } from "./progress-client";

export async function ProgressData({
  locale,
  initialDate,
  initialDay,
  initialTaskId,
}: {
  locale: "en" | "zh";
  initialDate?: string;
  initialDay?: number;
  initialTaskId?: string;
}) {
  const user = await getSessionUser();
  if (!user?.onboardedAt) redirect(`/${locale}/onboarding`);
  const currentDay = getCurrentDay(user.onboardedAt);

  let selectedDay = currentDay;
  if (initialDay) {
    selectedDay = initialDay;
  } else if (initialDate) {
    const msPerDay = 86_400_000;
    const clicked = new Date(initialDate + "T00:00:00.000Z");
    const onboarded = new Date(user.onboardedAt);
    onboarded.setUTCHours(0, 0, 0, 0);
    const elapsed = Math.floor((clicked.getTime() - onboarded.getTime()) / msPerDay);
    selectedDay = Math.min(Math.max(elapsed + 1, 1), 25);
  }

  const initialData = await getProgressForUser(
    user.id,
    user.onboardedAt.getTime(),
    selectedDay,
    locale,
    currentDay,
  );
  return <ProgressClient locale={locale} initialData={initialData} initialTaskId={initialTaskId} />;
}
