"use client";

import type { ProgramTask } from "@/src/features/content/program";
import { getLocalizedString } from "@/src/features/content";
import { localizeScriptureRef } from "@/src/features/bible/localize";
import { MarkdownContent } from "./markdown-content";
import { ReflectionInput } from "./reflection-input";

/**
 * Generic renderer for `type: devotional | scripture_study | info` tasks
 * loaded from the markdown program registry.
 *
 * Body markdown is split on `## ` headings into sections. Each section is
 * rendered through {@link MarkdownContent} with a small uppercase label,
 * so adding a new heading is zero code on the renderer side.
 *
 * Two visual specials:
 *   - `## Key Idea` → primary-tinted callout (mirrors the old
 *     DevotionalRenderer "Key Idea" blockquote).
 *   - `## Reflection` / `## Today's Practice` → followed by a
 *     {@link ReflectionInput} when the task's frontmatter `inputs:` array
 *     opts the section in. The submitted text is stored in
 *     `task_completions.data` keyed by the section slug.
 *
 * Section-name coupling is intentional and documented in
 * `docs/design/001-content-as-markdown.md`. Headings render literally; the
 * input opt-in uses a stable slug:
 *   "Reflection"        → "reflection"
 *   "Today's Practice"  → "practice"
 *
 * Any preamble before the first H2 renders as plain markdown.
 *
 * `passageRef` / `scriptureRef` from frontmatter render as a header above
 * the body — same visual as the old DevotionalRenderer passage line.
 */
export function SectionedContentRenderer({
  task,
  locale,
  completionData,
  onSaveReflectionAction,
}: {
  task: ProgramTask;
  locale: string;
  completionData: Record<string, unknown> | null;
  onSaveReflectionAction: (slug: string, text: string) => void | Promise<void>;
}) {
  const passageRef = localizeScriptureRef(
    task.passageRef ?? task.scriptureRef ?? "",
    locale,
  );
  const sections = splitSections(getLocalizedString(task.body, locale));
  const inputs = new Set(task.inputs ?? []);

  return (
    <div className="space-y-6">
      {passageRef && (
        <p className="font-headline text-lg font-bold text-foreground">
          {passageRef}
        </p>
      )}

      {sections.map((section, index) => (
        <Section
          key={index}
          heading={section.heading}
          markdown={section.markdown}
          inputs={inputs}
          completionData={completionData}
          locale={locale}
          onSaveReflectionAction={onSaveReflectionAction}
        />
      ))}
    </div>
  );
}

function Section({
  heading,
  markdown,
  inputs,
  completionData,
  locale,
  onSaveReflectionAction,
}: {
  heading: string | null;
  markdown: string;
  inputs: Set<string>;
  completionData: Record<string, unknown> | null;
  locale: string;
  onSaveReflectionAction: (slug: string, text: string) => void | Promise<void>;
}) {
  // Preamble (no heading) → plain markdown.
  if (heading === null) {
    if (!markdown) return null;
    return (
      <div className="space-y-2 text-xl leading-8 text-foreground">
        <MarkdownContent>{markdown}</MarkdownContent>
      </div>
    );
  }

  const slug = headingSlug(heading);

  // Special: Key Idea callout.
  if (slug === "key-idea") {
    return (
      <blockquote className="border-l-4 border-primary bg-primary/10 p-4 text-foreground">
        <p className="mb-1 text-sm font-bold uppercase tracking-widest text-primary">
          {heading}
        </p>
        <div className="text-xl leading-8 tracking-tight">
          <MarkdownContent>{markdown}</MarkdownContent>
        </div>
      </blockquote>
    );
  }

  // Reflection / Today's Practice (or any future input section): label +
  // markdown body + ReflectionInput when frontmatter opts the slug in.
  const inputSlug = inputSlugFor(slug);
  const showInput = inputSlug !== null && inputs.has(inputSlug);

  return (
    <div className="space-y-3">
      <p className="mb-1 text-sm font-bold uppercase tracking-widest text-primary">
        {heading}
      </p>
      {markdown && (
        <div className="space-y-2 text-xl leading-8 tracking-tight text-foreground">
          <MarkdownContent>{markdown}</MarkdownContent>
        </div>
      )}
      {showInput && inputSlug && (
        <ReflectionInput
          initialValue={readInitialValue(completionData, inputSlug)}
          onSaveAction={(text) => onSaveReflectionAction(inputSlug, text)}
          ariaLabel={heading}
          placeholder={
            locale === "zh" ? "写下你的回应…" : "Write your response…"
          }
        />
      )}
    </div>
  );
}

interface ParsedSection {
  heading: string | null;
  markdown: string;
}

/**
 * Split a markdown body on H2 headings. The leading chunk before the first
 * `## ` (if any) is returned with `heading: null` so the caller can render
 * it as plain prose. Headings deeper than H2 are left untouched inside the
 * section body and render normally via `MarkdownContent`.
 */
function splitSections(body: string): ParsedSection[] {
  const lines = body.split(/\r?\n/);
  const sections: ParsedSection[] = [];
  let currentHeading: string | null = null;
  let currentLines: string[] = [];

  function flush() {
    const markdown = currentLines.join("\n").trim();
    if (currentHeading !== null || markdown) {
      sections.push({ heading: currentHeading, markdown });
    }
  }

  for (const line of lines) {
    const m = /^##\s+(.*)$/.exec(line);
    if (m) {
      flush();
      currentHeading = m[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  flush();

  return sections;
}

const CHINESE_HEADING_SLUGS: Record<string, string> = {
  今日焦点: "today-s-focus",
  阅读笔记: "reading-notes",
  核心信息: "key-idea",
  反思时刻: "reflection",
  今日操练: "today-s-practice",
  "反思问题：": "question",
  "最后反思：": "final-reflection",
};

function headingSlug(heading: string): string {
  const normalized = heading.trim();
  if (CHINESE_HEADING_SLUGS[normalized])
    return CHINESE_HEADING_SLUGS[normalized];
  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Map a section slug to its `inputs:` opt-in key. Stable, short keys are
 * used so frontmatter stays terse:
 *   "Reflection"       → "reflection"
 *   "Today's Practice" → "practice"
 *
 * Returns `null` for sections that cannot host an input.
 */
function inputSlugFor(slug: string): string | null {
  if (slug === "reflection") return "reflection";
  if (slug === "today-s-practice" || slug === "todays-practice") {
    return "practice";
  }
  if (slug === "question" || slug === "final-reflection") return "question";
  return null;
}

function readInitialValue(
  completionData: Record<string, unknown> | null,
  key: string,
): string {
  const v = completionData?.[key];
  return typeof v === "string" ? v : "";
}
