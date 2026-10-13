import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";
import { getProgressForUser } from "@/src/features/progress";
import { getBlockStart } from "@/src/lib/program-gate";
import { getAttempts } from "@/src/features/progress/block-attempts";
import { CompletedBlockClient } from "./completed-block-client";

export async function CompletedBlockViewData({
  locale,
  blockNumber,
  initialDay,
}: {
  locale: "en" | "zh";
  blockNumber: number;
  initialDay?: number;
}) {
  const user = await getSessionUser();
  if (!user?.onboardedAt) redirect(`/${locale}/onboarding`);

  const cookieStore = await cookies();
  const timezone = decodeURIComponent(cookieStore.get("tz")?.value ?? "UTC");
  // getBlockStart returns a UTC-midnight marker so the SQL ::date cast / calendar math aligns.
  const attempts = await getAttempts(user.id);
  const blockStart = getBlockStart(user.onboardedAt, attempts, blockNumber, timezone);

  const selectedDay = initialDay ?? 1;

  // Pass currentDay=25 so all 25 days are accessible in the completed view.
  const initialData = await getProgressForUser(
    user.id,
    blockStart.getTime(),
    selectedDay,
    locale,
    25,
    blockNumber,
  );

  return <CompletedBlockClient locale={locale} initialData={initialData} />;
}
