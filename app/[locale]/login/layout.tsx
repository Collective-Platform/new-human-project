import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { GuestGate } from "../guest-gate";

export default async function LoginLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-[100svh] bg-surface">
      <Suspense fallback={null}>
        <GuestGate locale={locale} />
      </Suspense>
      {children}
    </div>
  );
}
