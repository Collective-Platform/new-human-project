"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { RadarChart } from "../dashboard/radar-chart";
import { StreakBadge } from "../dashboard/streak-badge";
import { ActivityCalendar } from "../dashboard/activity-calendar";
import { EmotionBreakdownChart } from "../dashboard/emotion-breakdown-chart";
import { PhysicalActivityChart } from "../dashboard/physical-activity-chart";
import type { DashboardData } from "@/src/features/dashboard";

export function CompletedBlockOverviewClient({
  data,
  blockNumber,
  locale,
}: {
  data: DashboardData;
  blockNumber: number;
  locale: string;
}) {
  const t = useTranslations("dashboard");
  const tp = useTranslations("progress");
  const router = useRouter();

  const blockLabel = locale === "zh" ? `第${blockNumber}周期总结` : `Block ${blockNumber} Overview`;

  return (
    <div className="space-y-4 px-4 sm:px-6 md:px-8 pt-4 pb-4">
      <div className="relative flex items-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground transition-colors -ml-1"
        >
          <ChevronLeft className="w-4 h-4" />
          {locale === "zh" ? "返回" : "Back"}
        </button>
        <h2 className="absolute left-1/2 -translate-x-1/2 text-base font-headline font-bold text-foreground">
          {blockLabel}
        </h2>
      </div>

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

      <div className="grid md:grid-cols-2 gap-4">
        <EmotionBreakdownChart
          breakdown={data.emotionBreakdown}
          title={t("emotionBreakdown")}
          emptyLabel={t("noMoodLogs")}
          blockLabel={blockLabel}
        />

        <PhysicalActivityChart
          activityByDay={data.physicalActivityByDay}
          blockLabel={blockLabel}
          title={t("physicalActivity")}
          emptyLabel={t("noActivityLogs")}
        />
      </div>

      <ActivityCalendar
        data={data.calendar}
        startDate={data.blockStartDate}
        title={t("activityCalendar")}
        blockLabel={blockLabel}
      />
    </div>
  );
}
