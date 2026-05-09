import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { ProfileData } from "./profile-data";
import { ProfileSkeleton } from "./profile-skeleton";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileData />
    </Suspense>
  );
}
