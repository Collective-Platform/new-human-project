"use client";

import { useState } from "react";

const moods = [
  { key: "terrible", emoji: "😡" },
  { key: "bad", emoji: "☹️" },
  { key: "okay", emoji: "😐" },
  { key: "good", emoji: "☺️" },
  { key: "excellent", emoji: "😆" },
] as const;

const influenceKeys = [
  "family",
  "friends",
  "love",
  "work",
  "school",
  "health",
] as const;

export function MoodLogRenderer({
  completed,
  initialData,
  onSubmit,
  loading,
  labels,
}: {
  completed: boolean;
  initialData: Record<string, unknown> | null;
  onSubmit: (data: {
    mood: string;
    moods: string[];
    influences: string[];
    context: string;
  }) => void;
  loading: boolean;
  labels: {
    pickEmoji: string;
    terrible: string;
    bad: string;
    okay: string;
    good: string;
    excellent: string;
    influences: string;
    family: string;
    friends: string;
    love: string;
    work: string;
    school: string;
    health: string;
    moreContext: string;
    submit: string;
    completed: string;
    updateMood: string;
  };
}) {
  const savedMoods = Array.isArray(initialData?.moods)
    ? (initialData.moods as string[])
    : initialData?.mood
      ? [initialData.mood as string]
      : [];
  const savedInfluences = (initialData?.influences as string[]) ?? [];
  const savedContext = (initialData?.context as string) ?? "";

  const [selectedMoods, setSelectedMoods] = useState<string[]>(savedMoods);
  const [influences, setInfluences] = useState<string[]>(savedInfluences);
  const [context, setContext] = useState(savedContext);

  const hasChanges =
    selectedMoods.length !== savedMoods.length ||
    selectedMoods.some((selectedMood) => !savedMoods.includes(selectedMood)) ||
    context !== savedContext ||
    influences.length !== savedInfluences.length ||
    influences.some((inf) => !savedInfluences.includes(inf));

  const moodLabels: Record<string, string> = {
    terrible: labels.terrible,
    bad: labels.bad,
    okay: labels.okay,
    good: labels.good,
    excellent: labels.excellent,
  };

  const influenceLabels: Record<string, string> = {
    family: labels.family,
    friends: labels.friends,
    love: labels.love,
    work: labels.work,
    school: labels.school,
    health: labels.health,
  };

  function toggleInfluence(key: string) {
    setInfluences((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function toggleMood(key: string) {
    setSelectedMoods((prev) => {
      if (prev.includes(key)) {
        return prev.filter((selectedMood) => selectedMood !== key);
      }

      if (prev.length >= 3) {
        return prev;
      }

      return [...prev, key];
    });
  }

  const canSubmit =
    !loading && selectedMoods.length > 0 && (!completed || hasChanges);

  let buttonLabel = labels.submit;
  if (completed && hasChanges) {
    buttonLabel = labels.updateMood;
  } else if (completed && !hasChanges) {
    buttonLabel = labels.completed;
  }

  return (
    <div className="space-y-6 rounded-lg bg-white p-6 shadow-card transition-shadow hover:shadow-[0_16px_40px_rgba(53,50,47,0.08)]">
      <section className="space-y-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-outline">
          {labels.pickEmoji}
        </p>
        <div className="flex items-center justify-around gap-2">
          {moods.map((m) => {
            const isSelected = selectedMoods.includes(m.key);
            const isMaxed = selectedMoods.length >= 3 && !isSelected;

            return (
              <button
                type="button"
                key={m.key}
                onClick={() => toggleMood(m.key)}
                disabled={isMaxed}
                aria-label={moodLabels[m.key]}
                aria-pressed={isSelected}
                title={moodLabels[m.key]}
                className={`flex h-14 w-12 items-center justify-center rounded-full text-3xl transition-all duration-300 ease-out active:scale-95 ${
                  isSelected
                    ? "scale-125 text-4xl drop-shadow-lg"
                    : isMaxed
                      ? "cursor-default grayscale opacity-25"
                      : "grayscale opacity-50 hover:scale-110 hover:grayscale-0 hover:opacity-100"
                }`}
              >
                <span>{m.emoji}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-outline">
          {labels.influences}
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {influenceKeys.map((key) => (
            <button
              type="button"
              key={key}
              onClick={() => toggleInfluence(key)}
              aria-pressed={influences.includes(key)}
              className={`w-full rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-all duration-200 active:scale-95 ${
                influences.includes(key)
                  ? "bg-secondary-container text-on-secondary-container ring-2 ring-secondary/20"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
              }`}
            >
              {influenceLabels[key]}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-outline">
          {labels.moreContext}
        </p>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-md border-0 bg-surface-container-low px-4 py-3 text-sm font-medium text-foreground placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
        />
      </section>

      <button
        type="button"
        onClick={() =>
          onSubmit({
            mood: selectedMoods[0] ?? "",
            moods: selectedMoods,
            influences,
            context,
          })
        }
        disabled={!canSubmit}
        className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-200 transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-default disabled:opacity-50 disabled:shadow-none"
      >
        {loading ? "…" : buttonLabel}
      </button>
    </div>
  );
}
