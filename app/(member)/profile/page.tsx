import { getSessionUser } from "@/src/features/auth";
import { getProfileForUser } from "@/src/features/profile/get-profile-for-user";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) return null;

  const initialData = await getProfileForUser(user.id);
  if (!initialData) return null;

  return <ProfileClient initialData={initialData} />;
}
