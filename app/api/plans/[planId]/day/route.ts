import { getSessionUser } from "@/src/features/auth";
import {
  PLAN_LENGTH_DAYS,
  getPlanDiscussion,
  getPlanForMember,
  getPlanMembersForDay,
} from "@/src/features/plans/queries";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: NO_STORE_HEADERS });
}

export async function GET(request: Request, context: RouteContext<"/api/plans/[planId]/day">) {
  const user = await getSessionUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { planId } = await context.params;
  if (!UUID_PATTERN.test(planId)) return json({ error: "Not found" }, 404);

  const day = Number(new URL(request.url).searchParams.get("day"));
  if (!Number.isInteger(day) || day < 1 || day > PLAN_LENGTH_DAYS) {
    return json({ error: `day must be between 1 and ${PLAN_LENGTH_DAYS}` }, 400);
  }

  const planState = await getPlanForMember(planId, user.id);
  if (!planState || !planState.plan.isGroup) {
    return json({ error: "Not found" }, 404);
  }

  const [members, discussion] = await Promise.all([
    getPlanMembersForDay(planId, day),
    getPlanDiscussion(planId, day),
  ]);
  return json({ members, discussion });
}
