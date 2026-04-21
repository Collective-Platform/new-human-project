"use client";

import { useState } from "react";

export function BilingualField({
  label,
  enValue,
  zhValue,
  onEnChange,
  onZhChange,
  multiline = false,
}: {
  label: string;
  enValue: string;
  zhValue: string;
  onEnChange: (value: string) => void;
  onZhChange: (value: string) => void;
  multiline?: boolean;
}) {
  const [tab, setTab] = useState<"en" | "zh">("en");

  const InputComponent = multiline ? "textarea" : "input";
  const inputClass =
    "w-full rounded-md bg-zinc-50 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" +
    (multiline ? " min-h-[100px] resize-y" : "");

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-foreground/50">
          {label}
        </label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab("en")}
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
              tab === "en"
                ? "bg-primary text-white"
                : "bg-zinc-100 text-foreground/50"
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setTab("zh")}
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
              tab === "zh"
                ? "bg-primary text-white"
                : "bg-zinc-100 text-foreground/50"
            }`}
          >
            中文
          </button>
        </div>
      </div>

      {tab === "en" && (
        <InputComponent
          value={enValue}
          onChange={(e) => onEnChange(e.target.value)}
          className={inputClass}
          placeholder="English"
        />
      )}

      {tab === "zh" && (
        <InputComponent
          value={zhValue}
          onChange={(e) => onZhChange(e.target.value)}
          className={inputClass}
          placeholder="中文"
        />
      )}
    </div>
  );
}
