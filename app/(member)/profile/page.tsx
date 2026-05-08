import { Suspense } from "react";
import { getSessionUser } from "@/src/features/auth";
import { ProfileData } from "./profile-data";
import { ProfileSkeleton } from "./profile-skeleton";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) return null;

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileData userId={user.id} />
    </Suspense>
  );
}
