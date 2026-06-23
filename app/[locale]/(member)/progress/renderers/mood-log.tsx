"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { PrimaryButton } from "@/app/components/primary-button";
import { TogglePill } from "@/app/components/toggle-pill";

const moods = [
  { key: "terrible", emoji: "😡" },
  { key: "bad", emoji: "☹️" },
  { key: "okay", emoji: "😶" },
  { key: "good", emoji: "😄" },
  { key: "excellent", emoji: "🤩" },
] as const;

const influenceKeys = ["god", "family", "friends", "love", "work", "school", "health", "leisure"] as const;

export const MOOD_EMOJI_MAP: Record<string, string> = {
  terrible: "😡",
  bad: "☹️",
  okay: "😶",
  good: "😄",
  excellent: "🤩",
};

export type MoodEntry = {
  moods: string[];
  influences: string[];
  context: string;
};

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

export function MoodLogRenderer({
  initialData,
  onSubmitAction,
  loading,
  openMode = "add",
}: {
  initialData: Record<string, unknown> | null;
  onSubmitAction: (data: Record<string, unknown>) => void;
  loading: boolean;
  openMode?: "add" | number;
}) {
  const tm = useTranslations("mood");
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
    terrible: tm("terrible"),
    bad: tm("bad"),
    okay: tm("okay"),
    good: tm("good"),
    excellent: tm("excellent"),
  };
  const influenceLabels: Record<string, string> = {
    family: tm("family"),
    friends: tm("friends"),
    love: tm("love"),
    work: tm("work"),
    school: tm("school"),
    health: tm("health"),
    god: tm("god"),
    leisure: tm("leisure"),
  };

  function toggleMood(key: string) {
    setFormMoods((prev) => {
      if (prev.includes(key)) return prev.filter((m) => m !== key);
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
  }

  function toggleInfluence(key: string) {
    setFormInfluences((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function handleSubmit() {
    const newEntry: MoodEntry = {
      moods: formMoods,
      influences: formInfluences,
      context: formContext,
    };
    if (typeof openMode === "number") {
      const all = [...existingEntries];
      all[openMode] = newEntry;
      onSubmitAction({ entries: all });
    } else {
      onSubmitAction({ entries: [...existingEntries, newEntry] });
    }
  }

  const canSubmit = !loading && formMoods.length > 0;
  const isEditing = typeof openMode === "number";

  return (
    <div className="space-y-6 rounded-lg bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover">
      <section className="space-y-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-outline">
          {tm("pickEmoji")}
        </p>
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

      <section className="space-y-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-outline">
          {tm("influences")}
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {influenceKeys.map((key) => (
            <TogglePill
              key={key}
              onClick={() => toggleInfluence(key)}
              aria-pressed={formInfluences.includes(key)}
              selected={formInfluences.includes(key)}
              variant="emotional"
            >
              {influenceLabels[key]}
            </TogglePill>
          ))}
        </div>
      </section>

      <section className="space-y-3 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-outline">
          {tm("moreContext")}
        </p>
        <textarea
          ref={contextRef}
          value={formContext}
          onChange={(e) => setFormContext(e.target.value)}
          onFocus={(e) => {
            const el = e.currentTarget;
            setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "nearest" }), 300);
          }}
          style={{ minHeight: "4.5rem" }}
          className="w-full resize-none overflow-hidden rounded-sm border-0 bg-surface-container-high px-4 py-3 text-sm font-medium text-foreground placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
        />
      </section>

      <PrimaryButton onClick={handleSubmit} disabled={!canSubmit} variant="emotional">
        {loading ? "…" : isEditing ? tm("updateMood") : tm("submit")}
      </PrimaryButton>
    </div>
  );
}
