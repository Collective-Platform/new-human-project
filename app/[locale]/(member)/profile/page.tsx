import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { ProfileData } from "./profile-data";
import { ProfileSkeleton } from "./profile-skeleton";
import { CompletedBlockViewData } from "./completed-block-view-data";
import { CompletedBlockOverviewData } from "./completed-block-overview-data";

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
  const { block, view, day, tab } = await searchParams;
  setRequestLocale(locale);

  // ?block=N&view=overview → read-only completed block dashboard
  if (view === "overview" && block) {
    const blockNumber = Math.max(1, Number(block) || 1);
    return (
      <Suspense fallback={<ProfileSkeleton />}>
        <CompletedBlockOverviewData locale={locale as "en" | "zh"} blockNumber={blockNumber} />
      </Suspense>
    );
  }

  // ?block=N&view=completed → read-only completed block view
  if (view === "completed" && block) {
    const blockNumber = Math.max(1, Number(block) || 1);
    const initialDay = day ? Math.min(Math.max(Number(day), 1), 25) : undefined;
    return (
      <Suspense fallback={<ProfileSkeleton />}>
        <CompletedBlockViewData
          locale={locale as "en" | "zh"}
          blockNumber={blockNumber}
          initialDay={initialDay}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileData initialTab={tab === "completed" ? "completed" : "activities"} />
    </Suspense>
  );
}
