import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { SignupForm } from "./signup-form";

export default async function SignupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm space-y-6 p-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold font-headline text-foreground">Welcome to Rhythm</h1>
            <p className="text-sm text-foreground/60">Create your account to begin your journey</p>
          </div>
          <Suspense>
            <SignupForm />
          </Suspense>
        </div>
      </div>

      <p className="pb-8 text-center text-sm text-foreground/60">
        Already have an account?{" "}
        <Link href="/login" className="text-secondary hover:underline font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
