import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";
import { NavVisibilityProvider } from "./nav-visibility";
import { SwRegisterLoader } from "./sw-register-loader";
import { AuthGate } from "./auth-gate";

export default async function MemberLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <NavVisibilityProvider>
        <Suspense
          fallback={
            <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl">
              <div className="mx-auto flex max-w-93.75 items-center justify-between px-4 py-3">
                <div className="flex items-center font-bold text-xl">Rhythm</div>
              </div>
            </header>
          }
        >
          <AppHeader />
        </Suspense>
        <main className="flex-1 overflow-y-auto pb-24">
          <Suspense fallback={null}>
            <AuthGate locale={locale} />
          </Suspense>
          {children}
        </main>
        <Suspense
          fallback={
            <div className="fixed bottom-0 inset-x-0 z-50 h-16 border-t border-white/20 bg-white/70 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]" />
          }
        >
          <BottomNav />
        </Suspense>
      </NavVisibilityProvider>
      <SwRegisterLoader />
    </div>
  );
}
