import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";
import { getProgressForUser } from "@/src/features/progress";
import { ProgressClient } from "./progress-client";

export default async function ProgressPage() {
  const store = await cookies();
  const locale = store.get("locale")?.value === "zh" ? "zh" : "en";

  const user = await getSessionUser();
  if (!user?.onboardedAt) {
    // Not onboarded -> bounce to onboarding (matches existing route auth behavior)
    redirect("/onboarding");
  }

  // Server-render the initial day's data so the page paints with real
  // content instead of a spinner. (Task 2.0 of tasks-perf-improvements.md)
  const initialData = await getProgressForUser(
    user.id,
    user.onboardedAt,
    null,
    locale,
  );

  return <ProgressClient locale={locale} initialData={initialData} />;
}
