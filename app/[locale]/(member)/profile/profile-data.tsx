import { getLocale } from "next-intl/server";
import { getSessionUser } from "@/src/features/auth";
import { getProfileForUser } from "@/src/features/profile/get-profile-for-user";
import {
  getFriendIds,
  getUserActivitiesCached,
  getLikeCountsForCompletions,
  getUserLikedCompletionIds,
} from "@/src/features/community";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";
import { getLocalizedString } from "@/src/features/content";
import { ProfileClient } from "./profile-client";
import type { FeedItem } from "../community/activity-feed";

const sportLabels: Record<string, Record<string, string>> = {
  en: {
    badminton: "Badminton",
    run: "Run",
    pickleball: "Pickleball",
    swimming: "Swimming",
    pilates: "Pilates",
  },
  zh: {
    badminton: "羽毛球",
    run: "跑步",
    pickleball: "匹克球",
    swimming: "游泳",
    pilates: "普拉提",
  },
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

function getExerciseEntries(
  data: Record<string, unknown> | null,
): Array<Record<string, unknown>> {
  if (!data) return [];
  if (Array.isArray(data.entries)) return data.entries as Array<Record<string, unknown>>;
  if (data.sportKey) return [data];
  return [];
}

function formatExerciseEntry(entry: Record<string, unknown>, locale: string): string {
  const labels = sportLabels[locale] ?? sportLabels.en;
  const fallback = exerciseFallback[locale] ?? exerciseFallback.en;
  const sportKey = entry.sportKey as string | undefined;
  if (!sportKey) return fallback;
  if (sportKey === "rest") return restLabel[locale] ?? restLabel.en;
  const sport =
    sportKey === "others"
      ? (entry.customSport as string | undefined) ?? fallback
      : (labels[sportKey] ?? fallback);
  const h = (entry.hours as number | undefined) ?? 0;
  const m = (entry.minutes as number | undefined) ?? 0;
  const dur = formatDuration(h, m, locale);
  if (!dur) return sport;
  return locale === "zh" ? `${sport} ${dur}` : `${sport} for ${dur}`;
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

  const activityCompletionIds = activityRows.map((r) => r.completionId);
  const [likeCounts, likedIds] = await Promise.all([
    getLikeCountsForCompletions(activityCompletionIds),
    getUserLikedCompletionIds(user.id, activityCompletionIds),
  ]);

  const activities: FeedItem[] = activityRows.flatMap((row) => {
    const base = {
      completionId: row.completionId,
      taskId: row.taskId,
      userId: user.id,
      displayName: initialData.user.displayName,
      searchHandle: initialData.user.searchHandle,
      avatarUrl: initialData.user.avatarUrl,
      completedAt: new Date(row.completedAtMs).toISOString(),
      likeCount: likeCounts[row.completionId] ?? 0,
      likedByMe: likedIds.has(row.completionId),
    };

    const registryTask = getRegistryTaskById(row.taskId);
    if (registryTask) {
      if (registryTask.type === "exercise") {
        const entries = getExerciseEntries(row.completionData ?? null);
        const nonRest = entries.filter((e) => (e.sportKey as string) !== "rest");
        if (nonRest.length === 0) {
          return [{ ...base, category: registryTask.category, activity: restLabel[locale] ?? restLabel.en }];
        }
        return nonRest.map((entry, i) => ({
          ...base,
          id: `${row.completionId}:${i}`,
          category: registryTask.category,
          activity: formatExerciseEntry(entry, locale),
        }));
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
      const entries = getExerciseEntries(row.completionData ?? null);
      const nonRest = entries.filter((e) => (e.sportKey as string) !== "rest");
      if (nonRest.length === 0) {
        return [{ ...base, category: row.dbCategory ?? "Physical", activity: restLabel[locale] ?? restLabel.en }];
      }
      return nonRest.map((entry, i) => ({
        ...base,
        id: `${row.completionId}:${i}`,
        category: row.dbCategory ?? "Physical",
        activity: formatExerciseEntry(entry, locale),
      }));
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
