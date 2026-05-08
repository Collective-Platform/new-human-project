"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { VerseCard } from "./verse-card";
import { RadarChart } from "./radar-chart";
import { StreakBadge } from "./streak-badge";
import { ActivityCalendar } from "./activity-calendar";
import { RecentFeed } from "./recent-feed";
import { TimeFilter } from "./time-filter";
import { BlockCelebration } from "./block-celebration";
import { BlockEncouragement } from "./block-encouragement";
import { FoundationCard } from "./foundation-card";
import type { DashboardData } from "@/src/features/dashboard";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("dashboard fetch failed");
    return r.json();
  });

export function DashboardClient({
  verse,
  initialData,
}: {
  verse: { reference: string; text: string } | null;
  initialData: DashboardData;
}) {
  const t = useTranslations("dashboard");
  const tp = useTranslations("progress");
  const [timeRange, setTimeRange] = useState<"7" | "30">("7");
  const [showCelebration, setShowCelebration] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);

  const { data: swrData } = useSWR<DashboardData>(
    `/api/dashboard?days=${timeRange}`,
    fetcher,
    {
      fallbackData: initialData,
      // Don't refetch just because the window regained focus.
      revalidateOnFocus: false,
      // Deduplicate rapid requests within 60s (e.g. quick tab switches
      // with no mutations in between). Invalidated explicitly after task
      // completion via mutate() in progress-client.tsx.
      dedupingInterval: 60_000,
    },
  );
  const data: DashboardData = swrData ?? initialData;

  // Badge system is on hold — celebration and encouragement overlays
  // are temporarily disabled until the badge design is finalized.
  // Code is preserved intentionally; do not delete.
  // To re-enable: add a useEffect([data]) here that checks
  // data?.earnedBadge and data?.blockEndedWithoutCompletion,
  // then calls setShowCelebration / setShowEncouragement accordingly.

  const now = new Date();

  return (
    <div className="space-y-4 px-4 pt-4 pb-4">
      {/* Block Completion Celebration Overlay (9.3 / 9.4) */}
      {showCelebration && data?.earnedBadge && (
        <BlockCelebration
          badge={data.earnedBadge}
          onDismiss={() => {
            localStorage.setItem(
              `badge-seen-${data.earnedBadge!.blockNumber}`,
              "1",
            );
            setShowCelebration(false);
          }}
        />
      )}

      {verse && (
        <VerseCard
          reference={verse.reference}
          text={verse.text}
          label={t("verseOfDay")}
        />
      )}

      {/* Block ended without completion encouragement (9.5) */}
      {showEncouragement && (
        <BlockEncouragement
          onDismiss={() => {
            localStorage.setItem("block-encourage-dismissed-1", "1");
            setShowEncouragement(false);
          }}
        />
      )}

      <div className="relative">
        <div className="absolute left-auto top-3 right-3">
          <StreakBadge count={data.streak} />
        </div>

        <RadarChart
          mental={data.radar.mental}
          emotional={data.radar.emotional}
          physical={data.radar.physical}
          labels={{
            mental: tp("mental"),
            emotional: tp("emotional"),
            physical: tp("physical"),
          }}
        />
      </div>

      <FoundationCard />

      <TimeFilter
        value={timeRange}
        onChange={setTimeRange}
        labels={{ last7: t("last7Days"), last30: t("last30Days") }}
      />

      <ActivityCalendar
        data={data.calendar}
        month={now.getMonth()}
        year={now.getFullYear()}
        title={t("activityCalendar")}
      />

      <RecentFeed
        items={data.recent}
        title={t("recentLogs")}
        emptyLabel="No recent activity"
      />
    </div>
  );
}
