import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { LoginForm } from "./login-form";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-[100svh] w-full flex-col">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm space-y-6 p-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold font-headline text-primary">Log In to Rhythm</h1>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
          <p className="text-center font-light text-xs text-foreground/60">
            We’ll email you a one-time code to log in securely.
          </p>
        </div>
      </div>

      <p className="pb-8 text-center text-sm text-foreground/60">
        Don&apos;t have an account yet?{" "}
        <Link href="/signup" className="text-primary hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
