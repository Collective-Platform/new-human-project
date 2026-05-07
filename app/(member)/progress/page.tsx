import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";
import { getCurrentDay } from "@/src/features/dashboard";
import { getProgressForUser } from "@/src/features/progress";
import { ProgressClient } from "./progress-client";

export default async function ProgressPage() {
  const store = await cookies();
  const locale = store.get("locale")?.value === "zh" ? "zh" : "en";

  const user = await getSessionUser();
  if (!user?.onboardedAt) {
    redirect("/onboarding");
  }

  // currentDay computed here (uses Date.now()) so getProgressForUser stays
  // deterministic and eligible for `use cache`.
  const currentDay = getCurrentDay(user.onboardedAt);

  // Server-render the initial day's data so the page paints with real
  // content instead of a spinner. (Task 2.0 of tasks-perf-improvements.md)
  // Result is served from the in-process cache on re-navigation; cache is
  // invalidated via revalidateTag('progress:userId') after task completion.
  const initialData = await getProgressForUser(
    user.id,
    user.onboardedAt,
    null,
    locale,
    currentDay,
  );

  return <ProgressClient locale={locale} initialData={initialData} />;
}
