import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// A maintenance window closes the app and its API, and shows one page in both languages.
// Turn it on with MAINTENANCE_MODE=1. A Vercel variable only takes effect after a redeploy.
// Open https://<site>/?maintenance_bypass=<MAINTENANCE_BYPASS_SECRET> to test behind the page.
//
// This reads process.env directly, like src/dev-board/enabled.ts. `src/env.ts` throws when a
// required variable is missing, and the proxy runs on every request, so it must not depend on it.

const BYPASS_PARAM = "maintenance_bypass";
const BYPASS_COOKIE = "maintenance_bypass";
const BYPASS_COOKIE_SECONDS = 2 * 60 * 60;
const RETRY_AFTER_SECONDS = "3600";

// The Rhythm Live event pages use no database, so they stay open.
function isLivePage(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0];
  if (host.split(".")[0] === "live") return true;
  return /^\/([a-z]{2}\/)?live(\/|$)/.test(request.nextUrl.pathname);
}

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="60">
<title>Rhythm</title>
<style>
  body { margin: 0; min-height: 100dvh; display: flex; align-items: center; justify-content: center;
    padding: 24px; box-sizing: border-box; background: #f4f5f5; color: #35322f; text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; }
  main { max-width: 360px; }
  .brand { margin: 0 0 32px; color: #be2b17; font-size: 24px; font-weight: 700; }
  h1 { margin: 0 0 8px; font-size: 22px; font-weight: 600; line-height: 1.3; }
  p { margin: 0; color: #625e5b; font-size: 15px; line-height: 1.5; }
  section + section { margin-top: 32px; }
</style>
</head>
<body>
<main>
  <p class="brand">Rhythm</p>
  <section>
    <h1>Rhythm is paused for an update</h1>
    <p>We'll be back within an hour. Your progress is safe.</p>
  </section>
  <section lang="zh-Hans">
    <h1>节奏正在更新，暂时无法使用</h1>
    <p>预计一小时内恢复。你的进度不会丢失。</p>
  </section>
</main>
</body>
</html>`;

/** The response to send during a maintenance window, or null when the request may continue. */
export function maintenanceResponse(request: NextRequest): NextResponse | null {
  if (process.env.MAINTENANCE_MODE !== "1" || isLivePage(request)) return null;

  const secret = process.env.MAINTENANCE_BYPASS_SECRET;
  if (secret) {
    if (request.nextUrl.searchParams.get(BYPASS_PARAM) === secret) {
      const url = request.nextUrl.clone();
      url.searchParams.delete(BYPASS_PARAM);
      const response = NextResponse.redirect(url);
      response.cookies.set(BYPASS_COOKIE, secret, {
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: BYPASS_COOKIE_SECONDS,
      });
      return response;
    }
    if (request.cookies.get(BYPASS_COOKIE)?.value === secret) return null;
  }

  const headers = { "Retry-After": RETRY_AFTER_SECONDS, "Cache-Control": "no-store" };
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Maintenance" }, { status: 503, headers });
  }
  return new NextResponse(PAGE, {
    status: 503,
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
  });
}
