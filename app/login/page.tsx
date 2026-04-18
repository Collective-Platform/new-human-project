import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="w-full max-w-sm space-y-6 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold font-headline text-foreground">
          The New Human Project
        </h1>
        <p className="text-sm text-foreground/60">
          Enter your email to sign in
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
