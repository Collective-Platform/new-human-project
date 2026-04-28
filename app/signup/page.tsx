import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/src/features/auth";
import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/");

  const { email } = await searchParams;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm space-y-6 p-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold font-headline text-foreground">
              Welcome to Rhythm
            </h1>
            <p className="text-sm text-foreground/60">
              Create your account to begin your journey
            </p>
          </div>
          <SignupForm initialEmail={email ?? ""} />
        </div>
      </div>

      <p className="pb-8 text-center text-sm text-foreground/60">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-secondary hover:underline font-medium"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
