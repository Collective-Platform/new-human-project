import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { SignupVerifyContent } from "./signup-verify-content";

export default async function SignupVerifyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-[100svh] w-full flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="space-y-2 text-center">
          <h1 className="font-(family-name:--font-headline) text-2xl font-bold text-foreground">
            Check your email
          </h1>
          <Suspense>
            <SignupVerifyContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
