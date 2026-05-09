import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { OnboardingGate } from "./onboarding-gate";

export default async function OnboardingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Suspense fallback={null}>
        <OnboardingGate locale={locale} />
      </Suspense>
      {children}
    </div>
  );
}
