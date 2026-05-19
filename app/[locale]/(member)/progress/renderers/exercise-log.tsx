"use client";

import { useState } from "react";

const sportKeys = ["run", "badminton", "pickleball", "swimming", "pilates", "others"] as const;

const sportEmojis: Record<string, string> = {
  run: "🏃",
  badminton: "🏸",
  pickleball: "🥒",
  swimming: "🏊",
  pilates: "🧘",
  others: "✏️",
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

export function ExerciseLogRenderer({
  completed,
  initialData,
  onSubmitAction,
  loading,
  isRestDay,
  labels,
}: {
  completed: boolean;
  initialData: Record<string, unknown> | null;
  onSubmitAction: (data: {
    sportKey: string;
    customSport?: string;
    hours?: number;
    minutes?: number;
  }) => void;
  loading: boolean;
  isRestDay: boolean;
  labels: {
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
    updateActivity: string;
    completed: string;
    restDay: string;
    restMessage: string;
    takeRest: string;
    rested: string;
  };
}) {
  const savedSportKey = (initialData?.sportKey as SportKey | undefined) ?? null;
  const savedCustomSport = (initialData?.customSport as string | undefined) ?? "";
  const savedHours = (initialData?.hours as number | undefined) ?? undefined;
  const savedMinutes = (initialData?.minutes as number | undefined) ?? undefined;

  // Lazy initializers run client-side only (this component is never SSR'd since
  // it mounts inside an activeTask modal triggered by user interaction).
  const [selectedSport, setSelectedSport] = useState<SportKey | null>(() => {
    if (savedSportKey) return savedSportKey;
    const ls = readLocalStorage();
    return ls?.sportKey === "others" ? "others" : null;
  });

  const [customSport, setCustomSport] = useState<string>(() => {
    if (savedCustomSport) return savedCustomSport;
    const ls = readLocalStorage();
    return ls?.sportKey === "others" ? (ls.customSport ?? "") : "";
  });

  const [hours, setHours] = useState<string>(savedHours !== undefined ? String(savedHours) : "");
  const [minutes, setMinutes] = useState<string>(
    savedMinutes !== undefined ? String(savedMinutes) : "",
  );

  const sportLabels: Record<SportKey, string> = {
    badminton: labels.badminton,
    run: labels.run,
    pickleball: labels.pickleball,
    swimming: labels.swimming,
    pilates: labels.pilates,
    others: labels.others,
  };

  const hasChanges =
    selectedSport !== savedSportKey ||
    customSport !== savedCustomSport ||
    (hours !== "" ? Number(hours) : undefined) !== savedHours ||
    (minutes !== "" ? Number(minutes) : undefined) !== savedMinutes;

  const canSubmit =
    !loading &&
    selectedSport !== null &&
    (selectedSport !== "others" || customSport.trim().length > 0) &&
    (!completed || hasChanges);

  let buttonLabel = labels.logActivity;
  if (completed && hasChanges) {
    buttonLabel = labels.updateActivity;
  } else if (completed && !hasChanges) {
    buttonLabel = labels.completed;
  }

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

    onSubmitAction({
      sportKey: selectedSport,
      customSport: selectedSport === "others" ? customSport.trim() : undefined,
      hours: h,
      minutes: m,
    });
  }

  if (isRestDay) {
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
          disabled={loading || completed}
          className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-200 transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-default disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? "…" : completed ? labels.rested : labels.takeRest}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-lg bg-white p-6 shadow-card transition-shadow hover:shadow-[0_16px_40px_rgba(53,50,47,0.08)]">
      <section className="space-y-4">
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
              <span className="mr-1.5">{sportEmojis[key]}</span>
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

      <section className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-outline">
          {labels.duration}
        </p>
        <div className="flex gap-3">
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
        {loading ? "…" : buttonLabel}
      </button>
    </div>
  );
}
