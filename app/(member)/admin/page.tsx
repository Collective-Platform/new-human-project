import { redirect } from "next/navigation";
import { getSessionUser, isAdmin } from "@/src/features/auth";
import { AdminClient } from "./admin-client";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user || !isAdmin(user)) redirect("/");

  return <AdminClient />;
}
