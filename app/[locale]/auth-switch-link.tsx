"use client";

import { useSearchParams } from "next/navigation";
import { Link } from "@/src/i18n/navigation";
import { safeReturnPath, withReturnPath } from "@/src/lib/return-path";

/** The link between login and signup. It keeps the invite the visitor came from. */
export function AuthSwitchLink({
  href,
  className,
  children,
}: {
  href: "/login" | "/signup";
  className?: string;
  children: React.ReactNode;
}) {
  const next = safeReturnPath(useSearchParams().get("next"));
  return (
    <Link href={withReturnPath(href, next)} className={className}>
      {children}
    </Link>
  );
}
