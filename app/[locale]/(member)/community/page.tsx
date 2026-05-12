import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import Loading from "./loading";
import { CommunityData } from "./community-data";

export default async function CommunityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<Loading />}>
      <CommunityData />
    </Suspense>
  );
}
