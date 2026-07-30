"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { RadarChart } from "../dashboard/radar-chart";
import { StreakBadge } from "../dashboard/streak-badge";
import { ActivityCalendar } from "../dashboard/activity-calendar";
import { EmotionBreakdownChart } from "../dashboard/emotion-breakdown-chart";
import { PhysicalActivityChart } from "../dashboard/physical-activity-chart";
import type { DashboardData } from "@/src/features/dashboard";
import { redoBlock } from "@/src/features/tasks/actions";

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
  const tp2 = useTranslations("profile");
  const router = useRouter();
  const [showRedoConfirm, setShowRedoConfirm] = useState(false);
  const [isRedoing, startRedoTransition] = useTransition();

  const blockLabel = locale === "zh" ? `第${blockNumber}周期总结` : `Block ${blockNumber} Overview`;

  function handleRedoConfirm() {
    startRedoTransition(async () => {
      const result = await redoBlock(blockNumber);
      if ("success" in result) {
        setShowRedoConfirm(false);
        router.push(`?block=${blockNumber}&view=completed`);
      }
    });
  }

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
        <button
          onClick={() => setShowRedoConfirm(true)}
          className="ml-auto text-[10px] font-medium uppercase tracking-wider text-foreground/40 hover:text-foreground/70 transition-colors"
        >
          {tp2("redoBlock")}
        </button>
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

      {showRedoConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={() => !isRedoing && setShowRedoConfirm(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 font-headline text-lg font-bold text-on-surface">
              {tp2("redoBlockTitle")}
            </h2>
            <p className="mb-6 text-sm text-on-surface-variant">
              {tp2("redoBlockBody", { blockNumber })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRedoConfirm(false)}
                disabled={isRedoing}
                className="flex-1 rounded-xl border border-outline-variant bg-surface-container px-4 py-3 text-sm font-medium text-on-surface transition-all active:scale-95 disabled:opacity-50"
              >
                {tp2("redoBlockCancel")}
              </button>
              <button
                onClick={handleRedoConfirm}
                disabled={isRedoing}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-on-primary transition-all active:scale-95 disabled:opacity-50"
              >
                {isRedoing ? "…" : tp2("redoBlockConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
