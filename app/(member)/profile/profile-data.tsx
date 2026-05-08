import { getProfileForUser } from "@/src/features/profile/get-profile-for-user";
import { ProfileClient } from "./profile-client";

export async function ProfileData({ userId }: { userId: number }) {
  const initialData = await getProfileForUser(userId);
  if (!initialData) return null;
  return <ProfileClient initialData={initialData} />;
}
