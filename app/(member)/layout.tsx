import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";
import { NavVisibilityProvider } from "./nav-visibility";
import { SwRegister } from "./sw-register";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.onboardedAt) redirect("/onboarding");

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <NavVisibilityProvider>
        <AppHeader />
        <main className="flex-1 overflow-y-auto pb-24">{children}</main>
        <BottomNav />
      </NavVisibilityProvider>
      <SwRegister />
    </div>
  );
}
