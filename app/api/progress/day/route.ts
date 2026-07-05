import { getDayContent } from "@/src/features/progress";
import { EARLIEST_TZ, isBlockReleased } from "@/src/lib/program-gate";

// User-agnostic: returns task definitions only (no completions, no session).
// Safe to cache at the Vercel Edge — all 500 users share the same content per
// (block, day, locale) tuple, so this generates a small fixed number of unique
// responses (25 days × 2 locales × number of blocks).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const dayParam = Number(url.searchParams.get("day"));
  const day = Number.isFinite(dayParam) && dayParam >= 1 && dayParam <= 25 ? dayParam : null;
  if (!day) return Response.json({ error: "day param required (1-25)" }, { status: 400 });

  // Block defaults to 1 for backward compatibility with callers that omit it.
  const blockParam = Number(url.searchParams.get("block"));
  const block = Number.isFinite(blockParam) && blockParam >= 1 ? blockParam : 1;

  // Global content lock (anti fetch-ahead): block content is sealed until its
  // launch date has begun somewhere on earth (EARLIEST_TZ). The exact per-user
  // local-midnight reveal is enforced in the page layer; this endpoint is shared
  // and cached, so it can't gate per device timezone. It serves task definitions
  // only — no user data — so a few hours of early availability is harmless.
  if (!isBlockReleased(block, new Date(), EARLIEST_TZ)) {
    return Response.json({ error: "Block not yet released" }, { status: 403 });
  }

  const localeParam = url.searchParams.get("locale");
  const locale = localeParam === "zh" ? "zh" : "en";

  const content = await getDayContent(block, day, locale);

  return Response.json(content, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
