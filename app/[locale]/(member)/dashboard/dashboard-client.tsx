"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { RadarChart } from "./radar-chart";
import { StreakBadge } from "./streak-badge";
import { ActivityCalendar } from "./activity-calendar";
import { EmotionBreakdownChart } from "./emotion-breakdown-chart";
import { PhysicalActivityChart } from "./physical-activity-chart";
// import { LiveBanner } from "./live-banner";
import type { HomeDashboardData } from "@/src/features/dashboard";
import { markBadgeSeen } from "@/src/features/badges/actions";
import { getBlockLabel } from "@/src/lib/block-names";

const BlockCelebration = dynamic(
  () => import("./block-celebration").then((m) => m.BlockCelebration),
  { ssr: false },
);

export function DashboardClient({
  data,
  plans,
  locale,
  children,
}: {
  /** Everything on Home, for all active blocks together. */
  data: HomeDashboardData;
  plans: Array<{ id: string; blockNumber: number; title: string | null }>;
  locale: "en" | "zh";
  children?: React.ReactNode;
}) {
  const t = useTranslations("dashboard");
  const tp = useTranslations("progress");
  const [showCelebration, setShowCelebration] = useState(!!data.earnedBadge);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.cookie = `tz=${encodeURIComponent(tz)}; path=/; SameSite=Lax; max-age=31536000`;
  }, []);

  // With one active block the charts name it; with several they cover all of them.
  const blockLabel = plans.length === 1 ? getBlockLabel(plans[0].blockNumber, locale) : undefined;

  return (
    <div className="space-y-4 px-4 sm:px-6 md:px-8 pt-4 pb-4">
      {showCelebration && data.earnedBadge && (
        <BlockCelebration
          badge={data.earnedBadge}
          onDismissAction={() => {
            markBadgeSeen(data.earnedBadge!.memberBadgeId);
            setShowCelebration(false);
          }}
        />
      )}

      {/* Uncomment the import and banner after updating the next Rhythm Live event details. */}
      {/* <LiveBanner /> */}

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

      {children}

      <div className="grid md:grid-cols-2 gap-4">
        <EmotionBreakdownChart
          breakdown={data.emotionBreakdown}
          title={t("emotionBreakdown")}
          emptyLabel={t("noMoodLogs")}
          blockLabel={blockLabel}
        />

        <PhysicalActivityChart
          activityByDay={data.activityLast25}
          blockLabel={t("last25Days")}
          title={t("physicalActivity")}
          emptyLabel={t("noActivityLogs")}
        />
      </div>

      <ActivityCalendar
        data={data.calendar}
        startDate={data.windowStartDate}
        title={t("activityCalendar")}
        blockLabel={t("last25Days")}
        labelByDate
      />
    </div>
  );
}
