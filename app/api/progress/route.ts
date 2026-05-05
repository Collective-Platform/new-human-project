import { cookies } from "next/headers";
import { getSessionUser } from "@/src/features/auth";
import { getProgressForUser } from "@/src/features/progress";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user?.onboardedAt) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dayParam = Number(url.searchParams.get("day"));
  const requestedDayParam = Number.isFinite(dayParam) && dayParam > 0
    ? dayParam
    : null;

  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value === "zh" ? "zh" : "en";

  const payload = await getProgressForUser(
    user.id,
    user.onboardedAt,
    requestedDayParam,
    locale,
  );

  return Response.json(payload);
}
