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
import { formatMonthLabel } from "./month-label";

const BlockCelebration = dynamic(
  () => import("./block-celebration").then((m) => m.BlockCelebration),
  { ssr: false },
);

export function DashboardClient({
  data,
  locale,
  children,
}: {
  /** Everything on Home, for all active blocks together. */
  data: HomeDashboardData;
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

  // The mood chart, the exercise chart and the calendar all show the current month.
  const monthLabel = formatMonthLabel(data.monthStartDate, locale);

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
          blockLabel={monthLabel}
        />

        <PhysicalActivityChart
          activityByDay={data.activityThisMonth}
          blockLabel={monthLabel}
          title={t("physicalActivity")}
          emptyLabel={t("noActivityLogs")}
        />
      </div>

      <ActivityCalendar
        data={data.calendar}
        monthStartDate={data.monthStartDate}
        title={t("activityCalendar")}
        locale={locale}
      />
    </div>
  );
}
