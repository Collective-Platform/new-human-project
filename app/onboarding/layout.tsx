import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.onboardedAt) redirect("/");

  return (
    <div className="min-h-screen flex flex-col bg-surface">{children}</div>
  );
}
