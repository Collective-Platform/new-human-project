"use client";

export function TimeFilter({
  value,
  onChange,
  labels,
}: {
  value: "7" | "30";
  onChange: (v: "7" | "30") => void;
  labels: { last7: string; last30: string };
}) {
  return (
    <div className="flex rounded-full bg-zinc-100 p-0.5">
      <button
        onClick={() => onChange("7")}
        className={`flex-1 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
          value === "7"
            ? "bg-white text-foreground shadow-sm"
            : "text-foreground/50"
        }`}
      >
        {labels.last7}
      </button>
      <button
        onClick={() => onChange("30")}
        className={`flex-1 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
          value === "30"
            ? "bg-white text-foreground shadow-sm"
            : "text-foreground/50"
        }`}
      >
        {labels.last30}
      </button>
    </div>
  );
}
