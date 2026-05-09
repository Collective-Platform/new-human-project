import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";

export async function OnboardingGate({ locale }: { locale: string }) {
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  if (user.onboardedAt) redirect(`/${locale}`);
  return null;
}
