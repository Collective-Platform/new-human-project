import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";
import { getProgressForUser } from "@/src/features/progress";
import { ProgressClient, type BlockCompletionInfo } from "./progress-client";
import { getActiveBlockForUser } from "@/src/features/progress/block-attempts";

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

  const cookieStore = await cookies();
  const timezone = decodeURIComponent(cookieStore.get("tz")?.value ?? "UTC");
  const now = new Date();
  const { blockNumber, blockStart, currentDay, state } = await getActiveBlockForUser(
    user,
    now,
    timezone,
  );

  const blockCompletion: BlockCompletionInfo = { state };

  let selectedDay = currentDay;
  if (initialDay) {
    selectedDay = initialDay;
  } else if (initialDate) {
    const msPerDay = 86_400_000;
    const clicked = new Date(initialDate + "T00:00:00.000Z");
    const blockStartMidnight = new Date(blockStart);
    blockStartMidnight.setUTCHours(0, 0, 0, 0);
    const elapsed = Math.floor((clicked.getTime() - blockStartMidnight.getTime()) / msPerDay);
    selectedDay = Math.min(Math.max(elapsed + 1, 1), 25);
  }

  const initialData = await getProgressForUser(
    user.id,
    blockStart.getTime(),
    selectedDay,
    locale,
    currentDay,
    blockNumber,
  );
  return (
    <ProgressClient
      key={blockNumber}
      locale={locale}
      initialData={initialData}
      initialTaskId={initialTaskId}
      blockCompletion={blockCompletion}
    />
  );
}
