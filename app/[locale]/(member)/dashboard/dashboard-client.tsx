"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { RadarChart } from "./radar-chart";
import { StreakBadge } from "./streak-badge";
import { ActivityCalendar } from "./activity-calendar";
import { EmotionBreakdownChart } from "./emotion-breakdown-chart";
import { PhysicalActivityChart } from "./physical-activity-chart";
import type { DashboardData } from "@/src/features/dashboard";
import { markBadgeSeen } from "@/src/features/badges/actions";
import { createPlan, selectDashboardPlan } from "@/src/features/plans/actions";
import { useRouter } from "@/src/i18n/navigation";
import { getBlockLabel } from "@/src/lib/block-names";

const BlockCelebration = dynamic(
  () => import("./block-celebration").then((m) => m.BlockCelebration),
  { ssr: false },
);

export function DashboardClient({
  initialData,
  plans,
  availableBlocks,
  selectedPlanId,
  locale,
  children,
}: {
  initialData: DashboardData | null;
  plans: Array<{ id: string; blockNumber: number; title: string | null }>;
  availableBlocks: number[];
  selectedPlanId: string | null;
  locale: "en" | "zh";
  children?: React.ReactNode;
}) {
  const t = useTranslations("dashboard");
  const tp = useTranslations("progress");
  const tpl = useTranslations("plans");
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(!!initialData?.earnedBadge);
  const [isPending, startTransition] = useTransition();
  const [selectionError, setSelectionError] = useState<string | null>(null);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.cookie = `tz=${encodeURIComponent(tz)}; path=/; SameSite=Lax; max-age=31536000`;
  }, []);

  const hasSelectedPlan = initialData !== null;
  const data: DashboardData = initialData ?? {
    blockNumber: 0,
    currentDay: 0,
    radar: { mental: 0, emotional: 0, physical: 0 },
    grid: [],
    streak: 0,
    calendar: [],
    earnedBadge: null,
    emotionBreakdown: {},
    physicalActivityByDay: [],
    blockStartDate: "1970-01-01",
  };
  const blockLabel = hasSelectedPlan
    ? getBlockLabel(data.blockNumber, locale)
    : t("chooseAnotherBlock");

  function updateDashboardPlan(planId: string) {
    setSelectionError(null);
    startTransition(async () => {
      if (planId.startsWith("new:")) {
        const result = await createPlan({ blockNumber: Number(planId.slice(4)), mode: "solo" });
        if ("success" in result) {
          router.push(`/progress/${result.data.planId}?day=1`);
        } else {
          setSelectionError(tpl("actionError"));
        }
        return;
      }

      const result = await selectDashboardPlan({ planId });
      if ("success" in result) {
        router.refresh();
      } else {
        setSelectionError(tpl("actionError"));
      }
    });
  }

  return (
    <div className="space-y-4 px-4 sm:px-6 md:px-8 pt-4 pb-4">
      <label className="block">
        <span className="sr-only">{t("dashboardPlan")}</span>
        <select
          value={selectedPlanId ?? ""}
          disabled={isPending}
          onChange={(event) => updateDashboardPlan(event.target.value)}
          className="w-full rounded-full bg-white px-4 py-3 text-sm font-medium text-on-surface shadow-[0_8px_24px_rgba(53,50,47,0.05)] focus:outline-none focus:ring-2 focus:ring-primary-container disabled:opacity-50"
        >
          {!hasSelectedPlan && (
            <option value="" disabled>
              {t("chooseAnotherBlock")}
            </option>
          )}
          {plans.length > 0 && (
            <optgroup label={t("yourActiveBlocks")}>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title || getBlockLabel(plan.blockNumber, locale)}
                </option>
              ))}
            </optgroup>
          )}
          {!hasSelectedPlan && (
            <optgroup label={t("startAnotherBlock")}>
              {availableBlocks.map((blockNumber) => (
                <option key={blockNumber} value={`new:${blockNumber}`}>
                  {getBlockLabel(blockNumber, locale)}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </label>
      {selectionError && (
        <p role="alert" className="text-sm text-primary">
          {selectionError}
        </p>
      )}
      {showCelebration && data.earnedBadge && (
        <BlockCelebration
          badge={data.earnedBadge}
          onDismissAction={() => {
            markBadgeSeen(data.earnedBadge!.memberBadgeId);
            setShowCelebration(false);
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
        planId={data.planId}
      />
    </div>
  );
}
