import { getDayContent } from "@/src/features/progress";

// User-agnostic: returns task definitions only (no completions, no session).
// Safe to cache at the Vercel Edge — all 500 users share the same content per
// (day, locale) pair, so this generates at most 25 × 2 = 50 unique responses.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const dayParam = Number(url.searchParams.get("day"));
  const day = Number.isFinite(dayParam) && dayParam >= 1 && dayParam <= 25 ? dayParam : null;
  if (!day) return Response.json({ error: "day param required (1-25)" }, { status: 400 });

  const localeParam = url.searchParams.get("locale");
  const locale = localeParam === "zh" ? "zh" : "en";

  const content = await getDayContent(1, day, locale);

  return Response.json(content, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
