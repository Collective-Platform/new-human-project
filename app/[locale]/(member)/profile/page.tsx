import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { ProfileData } from "./profile-data";
import { ProfileSkeleton } from "./profile-skeleton";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    block?: string;
    view?: string;
    day?: string;
    tab?: string;
  }>;
}) {
  const { locale } = await params;
  const { view, tab } = await searchParams;
  setRequestLocale(locale);

  if (view || tab === "completed") redirect(`/${locale}/progress?tab=completed`);

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileData />
    </Suspense>
  );
}
