"use client";

import { useEffect, useState } from "react";
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

interface EarnedBadge {
  name: string;
  description: string | null;
  iconUrl: string | null;
  blockNumber: number;
  earnedAt: string;
}

interface DashboardData {
  currentDay: number;
  radar: { mental: number; emotional: number; physical: number };
  grid: { day: number; categoriesCompleted: number }[];
  streak: number;
  calendar: { date: string; categories: string[] }[];
  recent: { category: string; name: string; completedAt: string }[];
  earnedBadge: EarnedBadge | null;
  blockEndedWithoutCompletion: boolean;
}

export function DashboardClient({
  verse,
}: {
  verse: { reference: string; text: string } | null;
}) {
  const t = useTranslations("dashboard");
  const tp = useTranslations("progress");
  const [timeRange, setTimeRange] = useState<"7" | "30">("7");
  const [data, setData] = useState<DashboardData | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch(`/api/dashboard?days=${timeRange}`);
      if (cancelled || !res.ok) return;

      const json: DashboardData = await res.json();
      if (cancelled) return;

      setData(json);

      // Badge system is on hold — celebration and encouragement overlays
      // are temporarily disabled until the badge design is finalized.
      // Code is preserved intentionally; do not delete.
      // if (json.earnedBadge) {
      //   const seenKey = `badge-seen-${json.earnedBadge.blockNumber}`;
      //   if (!localStorage.getItem(seenKey)) {
      //     setShowCelebration(true);
      //   }
      // }
      //
      // if (json.blockEndedWithoutCompletion && !json.earnedBadge) {
      //   const dismissKey = "block-encourage-dismissed-1";
      //   if (!localStorage.getItem(dismissKey)) {
      //     setShowEncouragement(true);
      //   }
      // }
    })();

    return () => {
      cancelled = true;
    };
  }, [timeRange]);

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

      {data && (
        <>
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
        </>
      )}

      {!data && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
