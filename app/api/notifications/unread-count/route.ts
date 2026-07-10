import { NextResponse } from "next/server";
import { getSessionUser } from "@/src/features/auth";
import { getUnreadSocialCount } from "@/src/features/notifications/queries";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const count = await getUnreadSocialCount(user.id);
  return NextResponse.json({ count });
}
