import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";
import { getPlansForUser } from "@/src/features/plans/queries";

export async function OnboardingGate({ locale }: { locale: string }) {
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  if (user.onboardedAt) {
    // Saving the username refreshes this page. A member whose only plan is the
    // fresh Ephesians plan goes straight into it, ready for day 1.
    const plans = await getPlansForUser(user.id);
    const [only] = plans;
    if (plans.length === 1 && only.blockNumber === 1 && !only.completedAt) {
      redirect(`/${locale}/progress/${only.id}`);
    }
    redirect(`/${locale}`);
  }
  return null;
}
