"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { VerseCard } from "./verse-card";
import { RadarChart } from "./radar-chart";
import { BlockGrid } from "./block-grid";
import { StreakBadge } from "./streak-badge";
import { ActivityCalendar } from "./activity-calendar";
import { RecentFeed } from "./recent-feed";
import { TimeFilter } from "./time-filter";

interface DashboardData {
  currentDay: number;
  radar: { mental: number; emotional: number; physical: number };
  grid: { day: number; categoriesCompleted: number }[];
  streak: number;
  calendar: { date: string; categories: string[] }[];
  recent: { category: string; name: string; completedAt: string }[];
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

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/dashboard?days=${timeRange}`);
    if (res.ok) {
      setData(await res.json());
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const now = new Date();

  return (
    <div className="space-y-4 px-4 pt-4 pb-4">
      {verse && (
        <VerseCard
          reference={verse.reference}
          text={verse.text}
          label={t("verseOfDay")}
        />
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StreakBadge count={data.streak} label={t("streakLabel")} />
            <BlockGrid
              days={data.grid}
              title={tp("dayLabel", { day: data.currentDay })}
            />
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
