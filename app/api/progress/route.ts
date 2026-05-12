import { cookies } from "next/headers";
import { getSessionUser } from "@/src/features/auth";
import { getCurrentDay } from "@/src/features/dashboard";
import { getProgressForUser } from "@/src/features/progress";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user?.onboardedAt) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dayParam = Number(url.searchParams.get("day"));
  const requestedDayParam = Number.isFinite(dayParam) && dayParam > 0 ? dayParam : null;

  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value === "zh" ? "zh" : "en";

  const currentDay = getCurrentDay(user.onboardedAt);

  const payload = await getProgressForUser(
    user.id,
    user.onboardedAt.getTime(),
    requestedDayParam,
    locale,
    currentDay,
  );

  return Response.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
