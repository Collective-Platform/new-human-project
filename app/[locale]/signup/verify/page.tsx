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
    <div className="w-full max-w-sm space-y-6 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold font-(family-name:--font-headline) text-foreground">
          Check your email
        </h1>
        <Suspense>
          <SignupVerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
