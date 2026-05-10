"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { RadarChart } from "./radar-chart";
import { StreakBadge } from "./streak-badge";
import { ActivityCalendar } from "./activity-calendar";
import { RecentFeed } from "./recent-feed";
import type { DashboardData } from "@/src/features/dashboard";

const BlockCelebration = dynamic(
  () => import("./block-celebration").then((m) => m.BlockCelebration),
  { ssr: false }
);
const BlockEncouragement = dynamic(
  () => import("./block-encouragement").then((m) => m.BlockEncouragement),
  { ssr: false }
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

  const data: DashboardData = initialData;

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

      {children}

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
