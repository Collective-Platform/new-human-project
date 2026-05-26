"use client";

import { useState } from "react";

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

type Labels = {
  selectActivity: string;
  badminton: string;
  run: string;
  pickleball: string;
  swimming: string;
  pilates: string;
  others: string;
  customActivityPlaceholder: string;
  duration: string;
  hours: string;
  minutes: string;
  logActivity: string;
  restDay: string;
  restMessage: string;
  takeRest: string;
  rested: string;
  addExercise: string;
  entryLabel: string;
};

export function ExerciseLogRenderer({
  initialData,
  onSubmitAction,
  loading,
  isRestDay,
  openMode = "add",
  labels,
}: {
  initialData: Record<string, unknown> | null;
  onSubmitAction: (data: Record<string, unknown>) => void;
  loading: boolean;
  isRestDay: boolean;
  openMode?: "add" | number;
  labels: Labels;
}) {
  const existingEntries = normalizeExerciseEntries(initialData);
  const editEntry = typeof openMode === "number" ? (existingEntries[openMode] ?? null) : null;

  const sportLabels: Record<SportKey, string> = {
    badminton: labels.badminton,
    run: labels.run,
    pickleball: labels.pickleball,
    swimming: labels.swimming,
    pilates: labels.pilates,
    others: labels.others,
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

  // Rest day special case — only in add mode
  if (isRestDay && typeof openMode !== "number") {
    const alreadyRested = existingEntries.some((e) => e.sportKey === "rest");
    return (
      <div className="space-y-6 rounded-lg bg-white p-6 shadow-card text-center">
        <div className="space-y-3">
          <p className="text-5xl">🛌</p>
          <p className="text-lg font-bold font-headline text-foreground">{labels.restDay}</p>
          <p className="text-sm text-on-surface-variant">{labels.restMessage}</p>
        </div>
        <button
          type="button"
          onClick={() => onSubmitAction({ sportKey: "rest" })}
          disabled={loading || alreadyRested}
          className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-200 transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-default disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? "…" : alreadyRested ? labels.rested : labels.takeRest}
        </button>
      </div>
    );
  }

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

  return (
    <div className="space-y-6 rounded-lg bg-white p-6 shadow-card transition-shadow hover:shadow-[0_16px_40px_rgba(53,50,47,0.08)]">
      <section className="space-y-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-outline">
          {labels.selectActivity}
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {sportKeys.map((key) => (
            <button
              type="button"
              key={key}
              onClick={() => setSelectedSport(key)}
              aria-pressed={selectedSport === key}
              className={`w-full rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-all duration-200 active:scale-95 ${
                selectedSport === key
                  ? "bg-tertiary-container text-on-tertiary-fixed-variant ring-2 ring-tertiary/20"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
              }`}
            >
              <span className="mr-1.5">{SPORT_EMOJIS[key]}</span>
              {sportLabels[key]}
            </button>
          ))}
        </div>

        {selectedSport === "others" && (
          <input
            type="text"
            value={customSport}
            onChange={(e) => setCustomSport(e.target.value)}
            placeholder={labels.customActivityPlaceholder}
            className="w-full rounded-md border-0 bg-surface-container-low px-4 py-3 text-sm font-medium text-foreground placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
        )}
      </section>

      <section className="space-y-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-outline">
          {labels.duration}
        </p>
        <div className="flex gap-3 text-left">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs font-semibold text-on-surface-variant">{labels.hours}</span>
            <input
              type="number"
              min="0"
              max="23"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="0"
              className="w-full rounded-md border-0 bg-surface-container-low px-4 py-3 text-sm font-medium text-foreground placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs font-semibold text-on-surface-variant">{labels.minutes}</span>
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="0"
              className="w-full rounded-md border-0 bg-surface-container-low px-4 py-3 text-sm font-medium text-foreground placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </label>
        </div>
      </section>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-200 transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-default disabled:opacity-50 disabled:shadow-none"
      >
        {loading ? "…" : labels.logActivity}
      </button>
    </div>
  );
}
