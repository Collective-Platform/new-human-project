"use client";

import { useState } from "react";
import { BilingualField } from "./bilingual-field";

interface TaskRow {
  id: string;
  dayNumber: number;
  category: string;
  taskType: string;
  name: string;
  content: Record<string, unknown> | null;
  displayOrder: number;
}

export function DayEditor({
  tasks,
  onSaved,
}: {
  tasks: TaskRow[];
  onSaved: () => void;
}) {
  const mentalTasks = tasks.filter((t) => t.category === "Mental");
  const otherTasks = tasks.filter((t) => t.category !== "Mental");

  return (
    <div className="border-t border-zinc-100 px-4 py-4 space-y-6">
      {/* Mental tasks: Level 1 (memorise) and Level 2 (study) */}
      {mentalTasks.map((task) => (
        <TaskEditor key={task.id} task={task} onSaved={onSaved} />
      ))}

      {/* Other tasks (Emotional, Physical) — usually no editable content */}
      {otherTasks.map((task) => (
        <div key={task.id} className="text-xs text-foreground/40">
          <span className="font-semibold">{task.category}</span> ·{" "}
          {task.name} ({task.taskType}) — no editable content
        </div>
      ))}
    </div>
  );
}

function TaskEditor({
  task,
  onSaved,
}: {
  task: TaskRow;
  onSaved: () => void;
}) {
  const content = task.content ?? {};
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Build initial form state from content JSONB
  const [formData, setFormData] = useState(() => {
    if (task.taskType === "scripture_memorise") {
      return {
        memory_verse_reference: (content.memory_verse_reference as string) ?? "",
        memory_verse_text_en: getLocaleValue(content.memory_verse_text, "en"),
        memory_verse_text_zh: getLocaleValue(content.memory_verse_text, "zh"),
        xp_weight: String(content.xp_weight ?? "1"),
      };
    }
    if (task.taskType === "scripture_study") {
      return {
        scripture_reference: (content.scripture_reference as string) ?? "",
        scripture_text_en: getLocaleValue(content.scripture_text, "en"),
        scripture_text_zh: getLocaleValue(content.scripture_text, "zh"),
        explanation_en: getLocaleValue(content.explanation, "en"),
        explanation_zh: getLocaleValue(content.explanation, "zh"),
        video_url: (content.video_url as string) ?? "",
        xp_weight: String(content.xp_weight ?? "2"),
      };
    }
    return {};
  });

  function update(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    let newContent: Record<string, unknown> = {};

    if (task.taskType === "scripture_memorise") {
      newContent = {
        memory_verse_reference: formData.memory_verse_reference || null,
        memory_verse_text: buildLocaleObj(
          formData.memory_verse_text_en,
          formData.memory_verse_text_zh
        ),
        xp_weight: parseInt(formData.xp_weight ?? "1") || 1,
      };
    } else if (task.taskType === "scripture_study") {
      newContent = {
        scripture_reference: formData.scripture_reference || null,
        scripture_text: buildLocaleObj(
          formData.scripture_text_en,
          formData.scripture_text_zh
        ),
        explanation: buildLocaleObj(
          formData.explanation_en,
          formData.explanation_zh
        ),
        video_url: formData.video_url || null,
        xp_weight: parseInt(formData.xp_weight ?? "2") || 2,
      };
    }

    const res = await fetch(`/api/admin/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent }),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      onSaved();
    }
  }

  const label =
    task.taskType === "scripture_memorise"
      ? "Level 1 — Memorise"
      : "Level 2 — Study";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-category-mental px-2 py-0.5 text-[10px] font-semibold text-white">
          Mental
        </span>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>

      {task.taskType === "scripture_memorise" && (
        <>
          <FieldRow label="Verse Reference">
            <input
              type="text"
              value={formData.memory_verse_reference ?? ""}
              onChange={(e) => update("memory_verse_reference", e.target.value)}
              className="w-full rounded-md bg-zinc-50 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="e.g. Ephesians 1:3"
            />
          </FieldRow>

          <BilingualField
            label="Memory Verse Text"
            enValue={formData.memory_verse_text_en ?? ""}
            zhValue={formData.memory_verse_text_zh ?? ""}
            onEnChange={(v) => update("memory_verse_text_en", v)}
            onZhChange={(v) => update("memory_verse_text_zh", v)}
          />
        </>
      )}

      {task.taskType === "scripture_study" && (
        <>
          <FieldRow label="Scripture Reference">
            <input
              type="text"
              value={formData.scripture_reference ?? ""}
              onChange={(e) => update("scripture_reference", e.target.value)}
              className="w-full rounded-md bg-zinc-50 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="e.g. Ephesians 1:1-14"
            />
          </FieldRow>

          <BilingualField
            label="Scripture Text"
            enValue={formData.scripture_text_en ?? ""}
            zhValue={formData.scripture_text_zh ?? ""}
            onEnChange={(v) => update("scripture_text_en", v)}
            onZhChange={(v) => update("scripture_text_zh", v)}
            multiline
          />

          <BilingualField
            label="Explanation"
            enValue={formData.explanation_en ?? ""}
            zhValue={formData.explanation_zh ?? ""}
            onEnChange={(v) => update("explanation_en", v)}
            onZhChange={(v) => update("explanation_zh", v)}
            multiline
          />

          <FieldRow label="Video URL">
            <input
              type="url"
              value={formData.video_url ?? ""}
              onChange={(e) => update("video_url", e.target.value)}
              className="w-full rounded-md bg-zinc-50 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="https://..."
            />
          </FieldRow>
        </>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-primary px-6 py-2 text-xs font-semibold text-white transition-colors active:bg-primary/80 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && (
          <span className="text-xs text-green-600 font-medium">
            ✓ Saved — live immediately
          </span>
        )}
      </div>
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-foreground/50">
        {label}
      </label>
      {children}
    </div>
  );
}

function getLocaleValue(field: unknown, locale: string): string {
  if (typeof field === "string") return locale === "en" ? field : "";
  if (typeof field === "object" && field !== null) {
    return (field as Record<string, string>)[locale] ?? "";
  }
  return "";
}

function buildLocaleObj(
  en: string | undefined,
  zh: string | undefined
): Record<string, string> | null {
  const obj: Record<string, string> = {};
  if (en?.trim()) obj.en = en.trim();
  if (zh?.trim()) obj.zh = zh.trim();
  return Object.keys(obj).length > 0 ? obj : null;
}
