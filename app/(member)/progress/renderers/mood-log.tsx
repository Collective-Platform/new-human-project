"use client";

import { useState } from "react";

const moods = [
  { key: "terrible", emoji: "😡" },
  { key: "bad", emoji: "☹️" },
  { key: "okay", emoji: "😐" },
  { key: "good", emoji: "☺️" },
  { key: "excellent", emoji: "😍" },
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
  const savedMood = (initialData?.mood as string) ?? "";
  const savedInfluences = (initialData?.influences as string[]) ?? [];
  const savedContext = (initialData?.context as string) ?? "";

  const [mood, setMood] = useState(savedMood);
  const [influences, setInfluences] = useState<string[]>(savedInfluences);
  const [context, setContext] = useState(savedContext);

  const hasChanges =
    mood !== savedMood ||
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
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  const canSubmit = !loading && !!mood && (!completed || hasChanges);

  let buttonLabel = labels.submit;
  if (completed && hasChanges) {
    buttonLabel = labels.updateMood;
  } else if (completed && !hasChanges) {
    buttonLabel = labels.completed;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-4 text-sm font-medium text-foreground">
          {labels.pickEmoji}
        </p>
        <div className="flex justify-between gap-2">
          {moods.map((m) => (
            <button
              key={m.key}
              onClick={() => setMood(m.key)}
              className={`flex flex-col items-center gap-1 rounded-md px-3 py-3 transition-colors hover:bg-zinc-50 ${
                mood === m.key ? "bg-zinc-100" : ""
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[10px] text-foreground/60">
                {moodLabels[m.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-4 text-sm font-medium text-foreground">
          {labels.influences}
        </p>
        <div className="flex flex-wrap gap-2">
          {influenceKeys.map((key) => (
            <button
              key={key}
              onClick={() => toggleInfluence(key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                influences.includes(key)
                  ? "bg-secondary text-white"
                  : "bg-zinc-100 text-foreground/70 hover:bg-zinc-200"
              }`}
            >
              {influenceLabels[key]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-foreground">
          {labels.moreContext}
        </p>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={3}
          className="w-full rounded-sm border border-foreground/10 bg-white px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <button
        onClick={() => onSubmit({ mood, influences, context })}
        disabled={!canSubmit}
        className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "…" : buttonLabel}
      </button>
    </div>
  );
}
