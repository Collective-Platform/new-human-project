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
    <div className="flex flex-col h-[100dvh] bg-surface overflow-hidden">
      <NavVisibilityProvider>
        <Suspense
          fallback={
            <header className="bg-white">
              <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
                <div className="flex items-center font-bold text-xl text-primary zh:text-2xl zh:font-kaiti-sc-black">
                  {locale === "zh" ? "节奏" : "Rhythm"}
                </div>
              </div>
            </header>
          }
        >
          <AppHeader />
        </Suspense>
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-3xl">
          <Suspense fallback={null}>
            <AuthGate locale={locale} />
          </Suspense>
          {children}
        </main>
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </NavVisibilityProvider>
      <SwRegisterLoader />
    </div>
  );
}
