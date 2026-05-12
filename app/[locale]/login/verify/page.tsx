import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { LoginVerifyContent } from "./login-verify-content";

export default async function VerifyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="w-full max-w-sm space-y-6 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold font-headline text-foreground">Check your email</h1>
        <Suspense>
          <LoginVerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
