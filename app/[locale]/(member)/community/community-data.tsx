import { getSessionUser } from "@/src/features/auth";
import {
  getFriendIds,
  getIncomingRequestIds,
  getSuggestionIds,
  getActivityFeedRows,
  getPublicProfile,
} from "@/src/features/community";
import { getTaskById as getRegistryTaskById } from "@/src/features/content/program";
import { getLocalizedString } from "@/src/features/content";
import { CommunityClient } from "./community-client";

function formatDuration(hours: number, minutes: number): string {
  if (hours === 0 && minutes === 0) return "";
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

const sportLabels: Record<string, string> = {
  badminton: "Badminton",
  run: "Run",
  pickleball: "Pickleball",
  swimming: "Swimming",
  pilates: "Pilates",
};

function getExerciseActivityLabel(data: Record<string, unknown> | null): string {
  if (!data) return "Exercise";
  const sportKey = data.sportKey as string | undefined;
  if (!sportKey) return "Exercise";
  if (sportKey === "rest") return "Rest";
  if (sportKey === "others") return (data.customSport as string | undefined) ?? "Exercise";
  return sportLabels[sportKey] ?? "Exercise";
}

export async function CommunityData() {
  const user = await getSessionUser();
  if (!user) return null;

  const [friendIds, requestIds, suggestionIds, feedRows] = await Promise.all([
    getFriendIds(user.id),
    getIncomingRequestIds(user.id),
    getSuggestionIds(user.id),
    getActivityFeedRows(user.id),
  ]);

  const ids = new Set<number>();
  for (const f of friendIds) ids.add(f.id);
  for (const r of requestIds) ids.add(r.senderId);
  for (const s of suggestionIds) ids.add(s.id);
  for (const row of feedRows) ids.add(row.userId);

  const profileEntries = await Promise.all(
    [...ids].map(async (id) => [id, await getPublicProfile(id)] as const),
  );
  const profiles = new Map(profileEntries);

  return (
    <CommunityClient
      initialData={{
        friends: friendIds.map((f) => {
          const profile = profiles.get(f.id);
          return {
            id: f.id,
            displayName: profile?.displayName ?? null,
            searchHandle: profile?.searchHandle ?? null,
            avatarUrl: profile?.avatarUrl ?? null,
            lastActivity:
              f.lastActivityMs != null ? new Date(f.lastActivityMs).toISOString() : null,
          };
        }),
        requests: requestIds.map((r) => {
          const profile = profiles.get(r.senderId);
          return {
            requestId: r.requestId,
            userId: r.senderId,
            displayName: profile?.displayName ?? null,
            searchHandle: profile?.searchHandle ?? null,
            avatarUrl: profile?.avatarUrl ?? null,
            createdAt: new Date(r.createdAtMs).toISOString(),
          };
        }),
        suggestions: suggestionIds.map((s) => {
          const profile = profiles.get(s.id);
          return {
            id: s.id,
            displayName: profile?.displayName ?? null,
            searchHandle: profile?.searchHandle ?? null,
            avatarUrl: profile?.avatarUrl ?? null,
            mutualCount: s.mutualCount,
          };
        }),
        feed: feedRows.flatMap((row) => {
          const profile = profiles.get(row.userId);
          const base = {
            displayName: profile?.displayName ?? null,
            searchHandle: profile?.searchHandle ?? null,
            avatarUrl: profile?.avatarUrl ?? null,
            completedAt: new Date(row.completedAtMs).toISOString(),
          };

          const registryTask = getRegistryTaskById(row.taskId);
          if (registryTask) {
            if (registryTask.type === "exercise") {
              const sport = getExerciseActivityLabel(row.completionData);
              const h = (row.completionData?.hours as number | undefined) ?? 0;
              const m = (row.completionData?.minutes as number | undefined) ?? 0;
              const dur = formatDuration(h, m);
              return [{ ...base, category: registryTask.category, activity: dur ? `${sport} for ${dur}` : sport }];
            }
            return [{ ...base, category: registryTask.category, activity: getLocalizedString(registryTask.name, "en") }];
          }

          if (row.dbTaskType === "exercise") {
            const sport = getExerciseActivityLabel(row.completionData);
            const h = (row.completionData?.hours as number | undefined) ?? 0;
            const m = (row.completionData?.minutes as number | undefined) ?? 0;
            const dur = formatDuration(h, m);
            return [{ ...base, category: row.dbCategory ?? "Physical", activity: dur ? `${sport} for ${dur}` : sport }];
          }

          return [];
        }),
      }}
    />
  );
}
