"use client";

import { useEffect, useRef, useState } from "react";

const moods = [
  { key: "terrible", emoji: "😡" },
  { key: "bad", emoji: "☹️" },
  { key: "okay", emoji: "😐" },
  { key: "good", emoji: "☺️" },
  { key: "excellent", emoji: "😆" },
] as const;

const influenceKeys = ["family", "friends", "love", "work", "school", "health"] as const;

export const MOOD_EMOJI_MAP: Record<string, string> = {
  terrible: "😡",
  bad: "☹️",
  okay: "😐",
  good: "☺️",
  excellent: "😆",
};

export type MoodEntry = { moods: string[]; influences: string[]; context: string };

export function normalizeEntries(data: Record<string, unknown> | null): MoodEntry[] {
  if (!data) return [];
  if (Array.isArray(data.entries)) return data.entries as MoodEntry[];
  const moodsArr = Array.isArray(data.moods)
    ? (data.moods as string[])
    : data.mood
      ? [data.mood as string]
      : [];
  if (moodsArr.length === 0) return [];
  return [
    {
      moods: moodsArr,
      influences: (data.influences as string[]) ?? [],
      context: (data.context as string) ?? "",
    },
  ];
}

type Labels = {
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
  addMoodLog: string;
  entryLabel: string;
};

export function MoodLogRenderer({
  initialData,
  onSubmit,
  loading,
  openMode = "add",
  labels,
}: {
  initialData: Record<string, unknown> | null;
  onSubmit: (data: Record<string, unknown>) => void;
  loading: boolean;
  openMode?: "add" | number;
  labels: Labels;
}) {
  const existingEntries = normalizeEntries(initialData);
  const editEntry = typeof openMode === "number" ? (existingEntries[openMode] ?? null) : null;

  const [formMoods, setFormMoods] = useState<string[]>(editEntry?.moods ?? []);
  const [formInfluences, setFormInfluences] = useState<string[]>(editEntry?.influences ?? []);
  const [formContext, setFormContext] = useState(editEntry?.context ?? "");
  const contextRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = contextRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [formContext]);

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

  function toggleMood(key: string) {
    setFormMoods((prev) => {
      if (prev.includes(key)) return prev.filter((m) => m !== key);
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
  }

  function toggleInfluence(key: string) {
    setFormInfluences((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function handleSubmit() {
    const newEntry: MoodEntry = { moods: formMoods, influences: formInfluences, context: formContext };
    if (typeof openMode === "number") {
      const all = [...existingEntries];
      all[openMode] = newEntry;
      onSubmit({ entries: all });
    } else {
      onSubmit({ entries: [...existingEntries, newEntry] });
    }
  }

  const canSubmit = !loading && formMoods.length > 0;
  const isEditing = typeof openMode === "number";

  return (
    <div className="space-y-6 rounded-lg bg-white p-6 shadow-card transition-shadow hover:shadow-[0_16px_40px_rgba(53,50,47,0.08)]">
      <section className="space-y-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-outline">{labels.pickEmoji}</p>
        <div className="flex items-center justify-around gap-2">
          {moods.map((m) => {
            const isSelected = formMoods.includes(m.key);
            const isMaxed = formMoods.length >= 3 && !isSelected;
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
        <p className="text-xs font-bold uppercase tracking-widest text-outline">{labels.influences}</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {influenceKeys.map((key) => (
            <button
              type="button"
              key={key}
              onClick={() => toggleInfluence(key)}
              aria-pressed={formInfluences.includes(key)}
              className={`w-full rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-all duration-200 active:scale-95 ${
                formInfluences.includes(key)
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
        <p className="text-xs font-bold uppercase tracking-widest text-outline">{labels.moreContext}</p>
        <textarea
          ref={contextRef}
          value={formContext}
          onChange={(e) => setFormContext(e.target.value)}
          style={{ minHeight: "4.5rem" }}
          className="w-full resize-none overflow-hidden rounded-md border-0 bg-surface-container-low px-4 py-3 text-sm font-medium text-foreground placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
        />
      </section>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-200 transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-default disabled:opacity-50 disabled:shadow-none"
      >
        {loading ? "…" : isEditing ? labels.updateMood : labels.submit}
      </button>
    </div>
  );
}
