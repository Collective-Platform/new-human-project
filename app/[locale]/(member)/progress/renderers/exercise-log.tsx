"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FieldInput } from "@/app/components/field-input";
import { PrimaryButton } from "@/app/components/primary-button";
import { TogglePill } from "@/app/components/toggle-pill";

const sportKeys = ["run", "badminton", "pickleball", "swimming", "pilates", "others"] as const;

export const SPORT_EMOJIS: Record<string, string> = {
  run: "🏃🏻",
  badminton: "🏸",
  pickleball: "🥒",
  swimming: "🏊🏻",
  pilates: "🧘🏻‍♀️",
  others: "💪🏻",
  rest: "🛌",
};
type SportKey = (typeof sportKeys)[number];

const LS_KEY = "nhp:exercise-last";

function readLocalStorage(): {
  sportKey: SportKey;
  customSport: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { sportKey: SportKey; customSport: string };
  } catch {
    return null;
  }
}

export type ExerciseEntry = {
  sportKey: string;
  customSport?: string;
  hours?: number;
  minutes?: number;
};

export function normalizeExerciseEntries(data: Record<string, unknown> | null): ExerciseEntry[] {
  if (!data) return [];
  if (Array.isArray(data.entries)) return data.entries as ExerciseEntry[];
  if (data.sportKey) {
    return [
      {
        sportKey: data.sportKey as string,
        customSport: data.customSport as string | undefined,
        hours: data.hours as number | undefined,
        minutes: data.minutes as number | undefined,
      },
    ];
  }
  return [];
}

export function formatDuration(hours?: number, minutes?: number): string {
  const h = hours ?? 0;
  const m = minutes ?? 0;
  const total = h * 60 + m;
  if (total === 0) return "";
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

export function ExerciseLogRenderer({
  initialData,
  onSubmitAction,
  loading,
  openMode = "add",
  readOnly = false,
}: {
  initialData: Record<string, unknown> | null;
  onSubmitAction: (data: Record<string, unknown>) => void;
  loading: boolean;
  openMode?: "add" | number;
  readOnly?: boolean;
}) {
  const t = useTranslations("exercise");
  const existingEntries = normalizeExerciseEntries(initialData);
  const editEntry = typeof openMode === "number" ? (existingEntries[openMode] ?? null) : null;
  const alreadyRested = existingEntries.some((e) => e.sportKey === "rest");
  const hasExerciseEntries = existingEntries.some((e) => e.sportKey !== "rest");
  const isEditingRest = typeof openMode === "number" && editEntry?.sportKey === "rest";
  const showRestCard = (typeof openMode !== "number" && !hasExerciseEntries) || isEditingRest;

  const sportLabels: Record<SportKey, string> = {
    badminton: t("badminton"),
    run: t("run"),
    pickleball: t("pickleball"),
    swimming: t("swimming"),
    pilates: t("pilates"),
    others: t("others"),
  };

  const [selectedSport, setSelectedSport] = useState<SportKey | null>(() => {
    if (editEntry) return editEntry.sportKey as SportKey;
    const ls = readLocalStorage();
    return ls?.sportKey === "others" ? "others" : null;
  });
  const [customSport, setCustomSport] = useState<string>(() => {
    if (editEntry) return editEntry.customSport ?? "";
    const ls = readLocalStorage();
    return ls?.sportKey === "others" ? (ls.customSport ?? "") : "";
  });
  const [hours, setHours] = useState<string>(() =>
    editEntry?.hours != null ? String(editEntry.hours) : "",
  );
  const [minutes, setMinutes] = useState<string>(() =>
    editEntry?.minutes != null ? String(editEntry.minutes) : "",
  );

  const canSubmit =
    !loading &&
    selectedSport !== null &&
    (selectedSport !== "others" || customSport.trim().length > 0);

  function handleSubmit() {
    if (!selectedSport) return;
    const h = hours !== "" ? Number(hours) : undefined;
    const m = minutes !== "" ? Number(minutes) : undefined;

    if (selectedSport === "others") {
      try {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({
            sportKey: "others",
            customSport: customSport.trim(),
          }),
        );
      } catch {}
    }

    const newEntry: ExerciseEntry = {
      sportKey: selectedSport,
      customSport: selectedSport === "others" ? customSport.trim() : undefined,
      hours: h,
      minutes: m,
    };

    if (typeof openMode === "number") {
      const all = [...existingEntries];
      all[openMode] = newEntry;
      onSubmitAction({ entries: all });
    } else {
      onSubmitAction({ entries: [...existingEntries, newEntry] });
    }
  }

  // Read-only rest entry: the sport pills can't represent "rested", so show a
  // simple confirmation card instead of an empty form.
  if (readOnly && isEditingRest) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow-card">
        <p className="text-xs font-bold uppercase tracking-widest text-outline">
          {SPORT_EMOJIS.rest} {t("rested")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 rounded-lg bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover">
        <section className="space-y-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-outline">
            {t("selectActivity")}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {sportKeys.map((key) => (
              <TogglePill
                key={key}
                onClick={() => setSelectedSport(key)}
                aria-pressed={selectedSport === key}
                selected={selectedSport === key}
                variant="physical"
                disabled={readOnly}
              >
                <span className="mr-1.5">{SPORT_EMOJIS[key]}</span>
                {sportLabels[key]}
              </TogglePill>
            ))}
          </div>

          {selectedSport === "others" && (
            <FieldInput
              type="text"
              value={customSport}
              onChange={(e) => setCustomSport(e.target.value)}
              placeholder={t("customActivityPlaceholder")}
              readOnly={readOnly}
            />
          )}
        </section>

        <section className="space-y-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-outline">
            {t("duration")}
          </p>
          <div className="flex gap-3 text-left">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs font-semibold text-on-surface-variant">{t("hours")}</span>
              <FieldInput
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0"
                readOnly={readOnly}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs font-semibold text-on-surface-variant">{t("minutes")}</span>
              <FieldInput
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="0"
                readOnly={readOnly}
              />
            </label>
          </div>
        </section>

        {!readOnly && (
          <PrimaryButton onClick={handleSubmit} disabled={!canSubmit} variant="physical">
            {loading ? "…" : t("logActivity")}
          </PrimaryButton>
        )}
      </div>
      {!readOnly && showRestCard && (
        <div className="mt-8 rounded-lg bg-white p-6 shadow-card text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-outline">
            🛌 {t("takeRestToday")}
          </p>
          <PrimaryButton
            onClick={() => onSubmitAction({ entries: [{ sportKey: "rest" }] })}
            disabled={loading || alreadyRested}
            variant="physical"
          >
            {loading ? "…" : alreadyRested ? t("rested") : t("takeRest")}
          </PrimaryButton>
        </div>
      )}
    </>
  );
}
