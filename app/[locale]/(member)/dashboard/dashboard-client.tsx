"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { RadarChart } from "./radar-chart";
import { StreakBadge } from "./streak-badge";
import { ActivityCalendar } from "./activity-calendar";
import { EmotionBreakdownChart } from "./emotion-breakdown-chart";
import { PhysicalActivityChart } from "./physical-activity-chart";
import type { DashboardData } from "@/src/features/dashboard";

const BlockCelebration = dynamic(
  () => import("./block-celebration").then((m) => m.BlockCelebration),
  { ssr: false },
);
const BlockEncouragement = dynamic(
  () => import("./block-encouragement").then((m) => m.BlockEncouragement),
  { ssr: false },
);

export function DashboardClient({
  initialData,
  children,
}: {
  initialData: DashboardData;
  children?: React.ReactNode;
}) {
  const t = useTranslations("dashboard");
  const tp = useTranslations("progress");
  const [showCelebration, setShowCelebration] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.cookie = `tz=${encodeURIComponent(tz)}; path=/; SameSite=Lax; max-age=31536000`;
  }, []);

  const data: DashboardData = initialData;

  // Badge system is on hold — celebration and encouragement overlays
  // are temporarily disabled until the badge design is finalized.
  // Code is preserved intentionally; do not delete.
  // To re-enable: add a useEffect([data]) here that checks
  // data?.earnedBadge and data?.blockEndedWithoutCompletion,
  // then calls setShowCelebration / setShowEncouragement accordingly.

  return (
    <div className="space-y-4 px-4 sm:px-6 md:px-8 pt-4 pb-4">
      {/* Block Completion Celebration Overlay (9.3 / 9.4) */}
      {showCelebration && data?.earnedBadge && (
        <BlockCelebration
          badge={data.earnedBadge}
          onDismissAction={() => {
            localStorage.setItem(`badge-seen-${data.earnedBadge!.blockNumber}`, "1");
            setShowCelebration(false);
          }}
        />
      )}

      {/* Block ended without completion encouragement (9.5) */}
      {showEncouragement && (
        <BlockEncouragement
          onDismissAction={() => {
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

      {children}

      <EmotionBreakdownChart
        breakdown={data.emotionBreakdown}
        title={t("emotionBreakdown")}
        emptyLabel={t("noMoodLogs")}
        blockLabel="Block 1"
      />

      <PhysicalActivityChart
        activityByDay={data.physicalActivityByDay}
        blockLabel="Block 1"
        title={t("physicalActivity")}
        emptyLabel={t("noActivityLogs")}
      />

      <ActivityCalendar
        data={data.calendar}
        startDate={data.blockStartDate}
        title={t("activityCalendar")}
        blockLabel="Block 1"
      />
    </div>
  );
}
