export function getCurrentDay(onboardedAt: Date): number {
  const msPerDay = 86_400_000;
  // Normalize both to UTC midnight so day boundaries align with calendar days,
  // not rolling 24h windows from the onboarding timestamp.
  const todayMidnight = new Date();
  todayMidnight.setUTCHours(0, 0, 0, 0);
  const onboardedMidnight = new Date(onboardedAt);
  onboardedMidnight.setUTCHours(0, 0, 0, 0);
  const daysElapsed = Math.floor(
    (todayMidnight.getTime() - onboardedMidnight.getTime()) / msPerDay,
  );
  return Math.min(Math.max(daysElapsed + 1, 1), 25);
}

// XP weight by task type — mirrors the `xp_weight` column in the legacy seed.
// Used when resolving Mental XP for registry tasks that have no DB content JSON.
export const XP_WEIGHT_BY_TYPE: Record<string, number> = {
  devotional: 2,
  scripture_study: 2,
  scripture_reading: 1,
  info: 1,
  mood_log: 0,
};
