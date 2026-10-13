import { cookies } from "next/headers";
import { getSessionUser } from "@/src/features/auth";
import { getProgressForUser } from "@/src/features/progress";
import { getActiveBlockForUser } from "@/src/features/progress/block-attempts";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user?.onboardedAt) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dayParam = Number(url.searchParams.get("day"));
  const requestedDayParam = Number.isFinite(dayParam) && dayParam > 0 ? dayParam : null;

  const localeParam = url.searchParams.get("locale");
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  const locale = (localeParam ?? localeCookie) === "zh" ? "zh" : "en";
  const timezone = decodeURIComponent(cookieStore.get("tz")?.value ?? "UTC");

  const { blockNumber, blockStart, currentDay } = await getActiveBlockForUser(
    user,
    new Date(),
    timezone,
  );

  const payload = await getProgressForUser(
    user.id,
    blockStart.getTime(),
    requestedDayParam,
    locale,
    currentDay,
    blockNumber,
  );

  return Response.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
