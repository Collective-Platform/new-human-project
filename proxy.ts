import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/src/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const MEMBER_SEGMENTS = [
  "dashboard",
  "progress",
  "profile",
  "community",
  "calendar",
  "admin",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const firstSegment = pathname.split("/")[1] ?? "";
  const locale = (routing.locales as readonly string[]).includes(firstSegment)
    ? firstSegment
    : routing.defaultLocale;

  const secondSegment = pathname.split("/")[2] ?? "";
  const hasSession = !!request.cookies.get("__session")?.value;

  // Logged-in users bypass login/signup
  if ((secondSegment === "login" || secondSegment === "signup") && hasSession) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  // Unauthenticated users can't reach onboarding
  if (secondSegment === "onboarding" && !hasSession) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // Member-area protection
  if (MEMBER_SEGMENTS.includes(secondSegment) && !hasSession) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
