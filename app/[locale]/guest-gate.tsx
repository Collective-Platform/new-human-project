import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/features/auth";

// Send members with a valid session to the dashboard. A stale cookie resolves
// to no user, so login/signup stay reachable to replace it.
export async function GuestGate({ locale }: { locale: string }) {
  const user = await getSessionUser();
  if (user) redirect(`/${locale}`);
  return null;
}
