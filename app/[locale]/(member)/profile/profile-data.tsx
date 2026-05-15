import { getLocale } from "next-intl/server";
import { getSessionUser } from "@/src/features/auth";
import { getProfileForUser } from "@/src/features/profile/get-profile-for-user";
import { getFriendIds, getUserActivitiesCached } from "@/src/features/community";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";
import { getLocalizedString } from "@/src/features/content";
import { ProfileClient } from "./profile-client";
import type { FeedItem } from "../community/activity-feed";

const sportLabels: Record<string, Record<string, string>> = {
  en: { badminton: "Badminton", run: "Run", pickleball: "Pickleball", swimming: "Swimming", pilates: "Pilates" },
  zh: { badminton: "羽毛球", run: "跑步", pickleball: "匹克球", swimming: "游泳", pilates: "普拉提" },
};
const exerciseFallback: Record<string, string> = { en: "Exercise", zh: "运动" };
const restLabel: Record<string, string> = { en: "Rest", zh: "休息日" };

function formatDuration(hours: number, minutes: number, locale: string): string {
  if (hours === 0 && minutes === 0) return "";
  if (locale === "zh") {
    if (hours === 0) return `${minutes}分钟`;
    if (minutes === 0) return `${hours}小时`;
    return `${hours}小时${minutes}分钟`;
  }
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function getExerciseActivityLabel(data: Record<string, unknown> | null, locale: string): string {
  const labels = sportLabels[locale] ?? sportLabels.en;
  const fallback = exerciseFallback[locale] ?? exerciseFallback.en;
  if (!data) return fallback;
  const sportKey = data.sportKey as string | undefined;
  if (!sportKey) return fallback;
  if (sportKey === "rest") return restLabel[locale] ?? restLabel.en;
  if (sportKey === "others") return (data.customSport as string | undefined) ?? fallback;
  return labels[sportKey] ?? fallback;
}

export async function ProfileData() {
  const user = await getSessionUser();
  if (!user) return null;

  const locale = await getLocale();

  const [initialData, friendIds, activityRows] = await Promise.all([
    getProfileForUser(user.id),
    getFriendIds(user.id),
    getUserActivitiesCached(user.id, user.id),
  ]);
  if (!initialData) return null;

  const activities: FeedItem[] = activityRows.flatMap((row) => {
    const base = {
      userId: user.id,
      displayName: initialData.user.displayName,
      searchHandle: initialData.user.searchHandle,
      avatarUrl: initialData.user.avatarUrl,
      completedAt: new Date(row.completedAtMs).toISOString(),
    };

    const registryTask = getRegistryTaskById(row.taskId);
    if (registryTask) {
      if (registryTask.type === "exercise") {
        const sport = getExerciseActivityLabel(row.completionData, locale);
        const h = (row.completionData?.hours as number | undefined) ?? 0;
        const m = (row.completionData?.minutes as number | undefined) ?? 0;
        const dur = formatDuration(h, m, locale);
        return [
          {
            ...base,
            category: registryTask.category,
            activity: dur ? (locale === "zh" ? `${sport} ${dur}` : `${sport} for ${dur}`) : sport,
          },
        ];
      }
      return [
        {
          ...base,
          category: registryTask.category,
          activity: getLocalizedString(registryTask.name, locale),
        },
      ];
    }

    if (row.dbTaskType === "exercise") {
      const sport = getExerciseActivityLabel(row.completionData, locale);
      const h = (row.completionData?.hours as number | undefined) ?? 0;
      const m = (row.completionData?.minutes as number | undefined) ?? 0;
      const dur = formatDuration(h, m, locale);
      return [
        {
          ...base,
          category: row.dbCategory ?? "Physical",
          activity: dur ? (locale === "zh" ? `${sport} ${dur}` : `${sport} for ${dur}`) : sport,
        },
      ];
    }

    return [];
  });

  return (
    <ProfileClient
      initialData={initialData}
      friendCount={friendIds.length}
      activities={activities}
      selfUserId={user.id}
    />
  );
}
