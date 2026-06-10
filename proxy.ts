import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/src/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const MEMBER_SEGMENTS = ["dashboard", "progress", "profile", "community", "calendar", "admin"];

// Subdomain that serves the standalone "Rhythm Live" event landing page.
// In production this is live.rhythm.you; we match any host whose first label
// is "live" so preview/staging subdomains (e.g. live.<branch>.vercel.app) work too.
const LIVE_HOST_LABEL = "live";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Host-based routing: live.rhythm.you -> /live route (no locale, no auth).
  // The /live page has no backend; the ticket CTA links out to ticket2u.
  const host = (request.headers.get("host") ?? "").split(":")[0];
  const isLiveHost = host.split(".")[0] === LIVE_HOST_LABEL;
  if (isLiveHost) {
    if (pathname.startsWith("/live")) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = `/live${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  const firstSegment = pathname.split("/")[1] ?? "";

  // Canonicalise the live landing page onto the live subdomain:
  // rhythm.you/live (and /<locale>/live) -> live.rhythm.you
  const isLocale = (routing.locales as readonly string[]).includes(firstSegment);
  const livePathSegment = isLocale ? (pathname.split("/")[2] ?? "") : firstSegment;
  if (livePathSegment === "live") {
    const url = request.nextUrl.clone();
    url.hostname = `${LIVE_HOST_LABEL}.${url.hostname}`;
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  const locale = isLocale ? firstSegment : routing.defaultLocale;

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
