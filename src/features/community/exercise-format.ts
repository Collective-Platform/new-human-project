import { getTranslations } from "next-intl/server";

export function getExerciseEntries(
  data: Record<string, unknown> | null,
): Array<Record<string, unknown>> {
  if (!data) return [];
  if (Array.isArray(data.entries)) return data.entries as Array<Record<string, unknown>>;
  if (data.sportKey) return [data];
  return [];
}

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

export async function createExerciseFormatter(locale: string) {
  const [t, tProgress] = await Promise.all([
    getTranslations({ locale, namespace: "exercise" }),
    getTranslations({ locale, namespace: "progress" }),
  ]);

  const restText = t("rest");
  const fallback = tProgress("exercise");

  const sportLabels: Record<string, string> = {
    badminton: t("badminton"),
    run: t("run"),
    pickleball: t("pickleball"),
    swimming: t("swimming"),
    pilates: t("pilates"),
  };

  return {
    restText,
    formatExerciseEntry(entry: Record<string, unknown>): string {
      const sportKey = entry.sportKey as string | undefined;
      if (!sportKey) return fallback;
      if (sportKey === "rest") return restText;
      const sport =
        sportKey === "others"
          ? ((entry.customSport as string | undefined) ?? fallback)
          : (sportLabels[sportKey] ?? fallback);
      const h = (entry.hours as number | undefined) ?? 0;
      const m = (entry.minutes as number | undefined) ?? 0;
      const dur = formatDuration(h, m, locale);
      if (!dur) return sport;
      return locale === "zh" ? `${sport} ${dur}` : `${sport} for ${dur}`;
    },
  };
}
