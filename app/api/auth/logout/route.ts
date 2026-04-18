import { destroySession } from "@/src/features/auth";

export async function POST() {
  await destroySession();
  return Response.json({ success: true });
}
