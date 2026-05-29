import { cookies } from "next/headers";
import { getSessionUser } from "@/src/features/auth";
import { getCurrentDay } from "@/src/features/dashboard";
import { getProgressForUser } from "@/src/features/progress";
import { PROGRAM_BLOCK_START } from "@/src/lib/program-gate";

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

  const effectiveStart =
    user.onboardedAt.getTime() < PROGRAM_BLOCK_START.getTime()
      ? PROGRAM_BLOCK_START
      : user.onboardedAt;
  const currentDay = getCurrentDay(effectiveStart);

  const payload = await getProgressForUser(
    user.id,
    effectiveStart.getTime(),
    requestedDayParam,
    locale,
    currentDay,
  );

  return Response.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
