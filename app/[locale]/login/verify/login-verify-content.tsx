"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/src/i18n/navigation";
import { VerifyForm } from "./verify-form";

export function LoginVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) router.replace("/login");
  }, [email, router]);

  if (!email) return null;

  return (
    <>
      <p className="text-sm text-foreground/60">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-foreground">{email}</span>
      </p>
      <VerifyForm email={email} />
    </>
  );
}
