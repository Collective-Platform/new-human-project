"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/src/i18n/navigation";
import { VerifyForm } from "@/app/[locale]/login/verify/verify-form";

export function SignupVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) router.replace("/signup");
  }, [email, router]);

  if (!email) return null;

  return (
    <>
      <p className="text-sm text-foreground/60">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-foreground">{email}</span>
      </p>
      <VerifyForm email={email} mode="signup" />
    </>
  );
}
