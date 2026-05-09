import { redirect } from "next/navigation";
import { getSessionUser, isAdmin } from "@/src/features/auth";
import { AdminClient } from "./admin-client";

export async function AdminData({ locale }: { locale: string }) {
  const user = await getSessionUser();
  if (!user || !isAdmin(user)) redirect(`/${locale}`);
  return <AdminClient />;
}
