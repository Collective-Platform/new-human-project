import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";
import { VerifyForm } from "./verify-form";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/");

  const { email } = await searchParams;
  if (!email) redirect("/login");

  return (
    <div className="w-full max-w-sm space-y-6 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-headline)] text-foreground">
          Check your email
        </h1>
        <p className="text-sm text-foreground/60">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>
      <VerifyForm email={email} />
    </div>
  );
}
