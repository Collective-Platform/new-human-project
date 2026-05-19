import { NextResponse } from "next/server";
import { getSessionUser } from "@/src/features/auth";
import { markNotificationsRead } from "@/src/features/notifications/queries";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await markNotificationsRead(user.id);
  return NextResponse.json({ success: true });
}
