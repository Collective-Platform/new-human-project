import { getLocale } from "next-intl/server";
import { getSessionUser } from "@/src/features/auth";
import {
  getPublicProfile,
  getPublicProfileByHandleCached,
  getFriendIds,
  getUserActivitiesCached,
  getSentRequestIdsCached,
} from "@/src/features/community";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";
import { getLocalizedString } from "@/src/features/content";
import { ProfileClient } from "./profile-client";

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

export async function ProfileData({ handle }: { handle: string }) {
  const user = await getSessionUser();
  if (!user) return null;

  const locale = await getLocale();

  const isNumericId = /^\d+$/.test(handle);
  const profile = await (isNumericId
    ? getPublicProfile(Number(handle))
    : getPublicProfileByHandleCached(handle));

  if (!profile) return null;

  const targetUserId = profile.id;

  const [activityRows, friendIds, viewerFriendIds, sentRequestIds] = await Promise.all([
    getUserActivitiesCached(user.id, targetUserId),
    getFriendIds(targetUserId),
    getFriendIds(user.id),
    getSentRequestIdsCached(user.id),
  ]);

  const viewerFriendSet = new Set(viewerFriendIds.map((f) => f.id));
  const sentSet = new Set(sentRequestIds);

  const connectionStatus: "friends" | "sent" | "none" = viewerFriendSet.has(targetUserId)
    ? "friends"
    : sentSet.has(targetUserId)
      ? "sent"
      : "none";

  const friendProfiles = await Promise.all(friendIds.map((f) => getPublicProfile(f.id)));
  const profileMap = new Map(friendIds.map((f, i) => [f.id, friendProfiles[i]]));

  const activities = activityRows.flatMap((row) => {
    const registryTask = getRegistryTaskById(row.taskId);
    const base = {
      userId: profile.id,
      displayName: profile.displayName,
      searchHandle: profile.searchHandle,
      avatarUrl: profile.avatarUrl,
      completedAt: new Date(row.completedAtMs).toISOString(),
    };

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

  const friends = friendIds
    .filter((f) => f.id !== user.id)
    .map((f) => {
      const p = profileMap.get(f.id);
      const friendStatus: "friends" | "sent" | "none" = viewerFriendSet.has(f.id)
        ? "friends"
        : sentSet.has(f.id)
          ? "sent"
          : "none";
      return {
        id: f.id,
        displayName: p?.displayName ?? null,
        searchHandle: p?.searchHandle ?? null,
        avatarUrl: p?.avatarUrl ?? null,
        connectionStatus: friendStatus,
      };
    });

  const isPrivate = connectionStatus !== "friends";

  return (
    <ProfileClient
      profile={profile}
      activities={isPrivate ? [] : activities}
      friends={isPrivate ? [] : friends}
      connectionStatus={connectionStatus}
    />
  );
}
