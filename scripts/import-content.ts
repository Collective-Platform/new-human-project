/**
 * Import program content verbatim from docx source files into the markdown
 * program files in data/program/block-{N}/.
 *
 * Reads the body text exactly as authored — no paraphrasing, no summarising.
 * Only section wrapper headings (## Today's Focus, etc.) are added as structural
 * scaffolding; all words beneath them come straight from the docx.
 *
 * Usage:
 *   pnpm content:import \
 *     --mental-en  path/to/holy-spirit-en.docx \
 *     --mental-zh  path/to/holy-spirit-zh.docx \
 *     --emotional-en path/to/emotional-en.docx \
 *     --emotional-zh path/to/emotional-zh.docx \
 *     --block 3 \
 *     [--dry-run]
 *
 * Each flag is optional — supply only the files you want to import.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import mammoth from "mammoth";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const mentalEnFile = arg("mental-en");
const mentalZhFile = arg("mental-zh");
const emotionalEnFile = arg("emotional-en");
const emotionalZhFile = arg("emotional-zh");
const block = Number(arg("block") ?? "3");
const dryRun = process.argv.includes("--dry-run");

if (!mentalEnFile && !mentalZhFile && !emotionalEnFile && !emotionalZhFile) {
  console.error(
    "Error: supply at least one of --mental-en, --mental-zh, --emotional-en, --emotional-zh",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParsedDay {
  day: number;
  title: string;
  passageRef?: string;
  preamble?: string; // text before the first ## heading (scripture quote for emotional)
  sections: { heading: string; content: string }[];
}

// ---------------------------------------------------------------------------
// Section label maps
// ---------------------------------------------------------------------------

// EN mental docx labels → markdown ## headings
const EN_MENTAL_LABELS: Record<string, string> = {
  "TODAY'S FOCUS": "Today's Focus",
  "READING NOTES": "Reading Notes",
  "KEY IDEA": "Key Idea",
  REFLECTION: "Reflection",
  "TODAY'S PRACTICE": "Today's Practice",
};

// ZH mental docx labels → markdown ## headings
// The file headings must match CHINESE_HEADING_SLUGS in sectioned-content.tsx
// so that the renderer applies the right visual treatment.
const ZH_MENTAL_LABELS: Record<string, string> = {
  今日焦点: "今日焦点",
  阅读笔记: "阅读笔记",
  核心信息: "核心思想", // maps to "key-idea" slug → callout box
  反思时刻: "今日反思", // maps to "reflection" slug → textarea
  今日操练: "今日操练", // maps to "today-s-practice" slug → textarea
};

// ---------------------------------------------------------------------------
// Text extraction
// ---------------------------------------------------------------------------

async function extractText(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Split raw text into trimmed non-empty paragraphs (separated by 2+ newlines). */
function toParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

// ---------------------------------------------------------------------------
// Mental devotional parser (EN + ZH share the same structure)
// ---------------------------------------------------------------------------

function parseMental(text: string, sectionLabels: Record<string, string>): ParsedDay[] {
  const paragraphs = toParagraphs(text);
  const days: ParsedDay[] = [];

  let i = 0;

  while (i < paragraphs.length) {
    const para = paragraphs[i];

    // Day boundary: a paragraph that is just 1 or 2 digits (1–25)
    if (/^\d{1,2}$/.test(para)) {
      const dayNum = parseInt(para, 10);
      if (dayNum >= 1 && dayNum <= 25) {
        i++;

        // Next paragraph: "Title   Passage Ref" (3+ spaces as separator)
        if (i >= paragraphs.length) break;
        const titleLine = paragraphs[i++];
        const titleMatch = titleLine.match(/^(.+?)\s{2,}(.+)$/);
        const title = titleMatch ? titleMatch[1].trim() : titleLine.trim();
        const passageRef = titleMatch ? titleMatch[2].trim() : undefined;

        // Collect sections until the next day number
        const sections: { heading: string; content: string }[] = [];
        let currentHeading: string | null = null;
        let currentParas: string[] = [];

        const flushSection = () => {
          if (currentHeading !== null) {
            sections.push({ heading: currentHeading, content: currentParas.join("\n\n") });
            currentHeading = null;
            currentParas = [];
          }
        };

        while (i < paragraphs.length) {
          const p = paragraphs[i];

          // Stop when we hit the next day number
          if (/^\d{1,2}$/.test(p) && parseInt(p, 10) >= 1 && parseInt(p, 10) <= 25) break;

          const mappedHeading = sectionLabels[p];
          if (mappedHeading) {
            flushSection();
            currentHeading = mappedHeading;
          } else if (currentHeading !== null) {
            // Only add content paragraphs; skip movement-intro lines
            if (!isMovementIntro(p)) {
              currentParas.push(p);
            }
          }
          // else: preamble text before first section label — skip

          i++;
        }
        flushSection();

        if (sections.length > 0) {
          days.push({ day: dayNum, title, passageRef, sections });
        }
        continue;
      }
    }

    i++;
  }

  return days;
}

/**
 * Movement-intro paragraphs (between days) that should not be appended to the
 * preceding day's last section.
 */
function isMovementIntro(para: string): boolean {
  return (
    /^MOVEMENT\s+\d/i.test(para) ||
    /^Days?\s+\d{1,2}[–\-]\d{1,2}/i.test(para) ||
    /^第[一二三四五六七八九十]+动作/u.test(para) ||
    // Single-word movement subtitles that appear alone (e.g. "The Person", "of the Spirit")
    (para.split(/\s+/).length <= 4 && /^[A-Z]/.test(para) && /^[A-Za-z\s&]+$/.test(para) && para.length < 40)
  );
}

// ---------------------------------------------------------------------------
// Emotional devotional parser (EN)
// ---------------------------------------------------------------------------

function parseEmotionalEN(text: string): ParsedDay[] {
  const paragraphs = toParagraphs(text);
  const days: ParsedDay[] = [];

  let i = 0;

  while (i < paragraphs.length) {
    const para = paragraphs[i];

    // Day boundary: "DAY N — Title"
    const dayMatch = para.match(/^DAY\s+(\d{1,2})\s+[—–-]\s+(.+)$/i);
    if (!dayMatch) {
      i++;
      continue;
    }

    const dayNum = parseInt(dayMatch[1], 10);
    i++;

    // Scripture reference paragraph: "Scripture: Ref"
    // Some days embed the verse text after " - " in the same paragraph.
    let passageRef: string | undefined;
    const scriptureLines: string[] = [];
    if (i < paragraphs.length && /^Scripture:/i.test(paragraphs[i])) {
      const scriptureContent = paragraphs[i].replace(/^Scripture:\s*/i, "").trim();
      const dashIdx = scriptureContent.indexOf(" - ");
      if (dashIdx !== -1) {
        // Format: "Ref - verse text..."
        passageRef = scriptureContent.substring(0, dashIdx).trim();
        scriptureLines.push(scriptureContent.substring(dashIdx + 3).trim());
      } else {
        passageRef = scriptureContent;
      }
      i++;
    }

    // Scripture verse text: the next paragraph(s) that start with a verse number.
    // Use a simple digit+space prefix check to handle Unicode curly quotes (" etc.).
    while (
      i < paragraphs.length &&
      !isPracticeLabel(paragraphs[i], "en") &&
      !isQuestionLabel(paragraphs[i], "en") &&
      !isEmotionalDayStart(paragraphs[i], "en")
    ) {
      const p = paragraphs[i];
      if (/^\d+\s/.test(p)) {
        scriptureLines.push(p);
        i++;
      } else {
        break;
      }
    }

    // Reading notes: prose paragraphs until Practice or Question or next day
    const readingParas: string[] = [];
    while (
      i < paragraphs.length &&
      !isPracticeLabel(paragraphs[i], "en") &&
      !isQuestionLabel(paragraphs[i], "en") &&
      !isEmotionalDayStart(paragraphs[i], "en")
    ) {
      readingParas.push(paragraphs[i]);
      i++;
    }

    // Practice paragraph
    let practiceText = "";
    const practiceLines: string[] = [];
    if (i < paragraphs.length && isPracticeLabel(paragraphs[i], "en")) {
      // Strip the "Practice: " label prefix from the first line
      practiceLines.push(paragraphs[i].replace(/^Practice:\s*/i, "").trim());
      i++;
      // Collect continuation paragraphs (fill-in-the-blank lines, etc.)
      while (
        i < paragraphs.length &&
        !isQuestionLabel(paragraphs[i], "en") &&
        !isEmotionalDayStart(paragraphs[i], "en") &&
        !isPracticeLabel(paragraphs[i], "en")
      ) {
        practiceLines.push(paragraphs[i]);
        i++;
      }
      practiceText = practiceLines.join("\n\n");
    }

    // Question / Reflection paragraph
    let reflectionText = "";
    if (i < paragraphs.length && isQuestionLabel(paragraphs[i], "en")) {
      reflectionText = paragraphs[i].replace(/^Question:\s*/i, "").trim();
      i++;
    }

    // Build preamble: passageRef + scripture text
    let preamble = "";
    if (passageRef && scriptureLines.length > 0) {
      preamble = `**${passageRef}**\n\n${scriptureLines.join("\n\n")}`;
    } else if (passageRef) {
      preamble = `**${passageRef}**`;
    }

    const sections: { heading: string; content: string }[] = [];
    if (readingParas.length > 0) {
      sections.push({ heading: "Reading Notes", content: readingParas.join("\n\n") });
    }
    if (practiceText) {
      sections.push({ heading: "Practice", content: practiceText });
    }
    if (reflectionText) {
      sections.push({ heading: "Reflection", content: reflectionText });
    }

    days.push({ day: dayNum, title: dayMatch[2].trim(), passageRef, preamble, sections });
  }

  return days;
}

// ---------------------------------------------------------------------------
// Emotional devotional parser (ZH)
// ---------------------------------------------------------------------------

function parseEmotionalZH(text: string): ParsedDay[] {
  const paragraphs = toParagraphs(text);
  const days: ParsedDay[] = [];

  let i = 0;

  while (i < paragraphs.length) {
    const para = paragraphs[i];

    // Day boundary: "第N天 — Title"
    const dayMatch = para.match(/^第\s*(\d{1,2})\s*天\s*[—–-]\s*(.+)$/u);
    if (!dayMatch) {
      i++;
      continue;
    }

    const dayNum = parseInt(dayMatch[1], 10);
    i++;

    // Scripture reference: "经文：Ref"
    let passageRef: string | undefined;
    if (i < paragraphs.length && /^经文[：:]/.test(paragraphs[i])) {
      passageRef = paragraphs[i].replace(/^经文[：:]\s*/, "").trim();
      i++;
    }

    // Scripture verse text: paragraphs starting with a verse number + space
    const scriptureLines: string[] = [];
    while (
      i < paragraphs.length &&
      !isPracticeLabel(paragraphs[i], "zh") &&
      !isQuestionLabel(paragraphs[i], "zh") &&
      !isEmotionalDayStart(paragraphs[i], "zh")
    ) {
      const p = paragraphs[i];
      if (/^\d+\s/.test(p)) {
        scriptureLines.push(p);
        i++;
      } else {
        break;
      }
    }

    // Reading notes prose
    const readingParas: string[] = [];
    while (
      i < paragraphs.length &&
      !isPracticeLabel(paragraphs[i], "zh") &&
      !isQuestionLabel(paragraphs[i], "zh") &&
      !isEmotionalDayStart(paragraphs[i], "zh")
    ) {
      readingParas.push(paragraphs[i]);
      i++;
    }

    // Practice
    const practiceLines: string[] = [];
    if (i < paragraphs.length && isPracticeLabel(paragraphs[i], "zh")) {
      practiceLines.push(paragraphs[i].replace(/^(操练|实践)[：:]\s*/, "").trim());
      i++;
      while (
        i < paragraphs.length &&
        !isQuestionLabel(paragraphs[i], "zh") &&
        !isEmotionalDayStart(paragraphs[i], "zh") &&
        !isPracticeLabel(paragraphs[i], "zh")
      ) {
        practiceLines.push(paragraphs[i]);
        i++;
      }
    }

    // Question
    let reflectionText = "";
    if (i < paragraphs.length && isQuestionLabel(paragraphs[i], "zh")) {
      reflectionText = paragraphs[i].replace(/^问题[：:]\s*/, "").trim();
      i++;
    }

    let preamble = "";
    if (passageRef && scriptureLines.length > 0) {
      preamble = `**${passageRef}**\n\n${scriptureLines.join("\n\n")}`;
    } else if (passageRef) {
      preamble = `**${passageRef}**`;
    }

    const sections: { heading: string; content: string }[] = [];
    if (readingParas.length > 0) {
      sections.push({ heading: "阅读笔记", content: readingParas.join("\n\n") });
    }
    if (practiceLines.length > 0) {
      sections.push({ heading: "今日操练", content: practiceLines.join("\n\n") });
    }
    if (reflectionText) {
      sections.push({ heading: "今日反思", content: reflectionText });
    }

    days.push({ day: dayNum, title: dayMatch[2].trim(), passageRef, preamble, sections });
  }

  return days;
}

// ---------------------------------------------------------------------------
// Label detection helpers
// ---------------------------------------------------------------------------

function isPracticeLabel(para: string, lang: "en" | "zh"): boolean {
  if (lang === "en") return /^Practice:/i.test(para);
  return /^(操练|实践)[：:]/.test(para);
}

function isQuestionLabel(para: string, lang: "en" | "zh"): boolean {
  if (lang === "en") return /^Question:/i.test(para);
  return /^问题[：:]/.test(para);
}

function isEmotionalDayStart(para: string, lang: "en" | "zh"): boolean {
  if (lang === "en") return /^DAY\s+\d{1,2}\s+[—–-]/i.test(para);
  return /^第\s*\d{1,2}\s*天\s*[—–-]/u.test(para);
}

// ---------------------------------------------------------------------------
// Build markdown body from parsed day
// ---------------------------------------------------------------------------

function buildBody(day: ParsedDay): string {
  const parts: string[] = [];

  if (day.preamble) {
    parts.push(day.preamble);
  }

  for (const section of day.sections) {
    parts.push(`## ${section.heading}\n\n${section.content}`);
  }

  return parts.join("\n\n") + "\n";
}

// ---------------------------------------------------------------------------
// File-system helpers
// ---------------------------------------------------------------------------

/** Find the devotional .md file for a given block/day/category. */
function findDevotionalFile(
  block: number,
  day: number,
  category: "Mental" | "Emotional",
): string | null {
  const dayDir = join(process.cwd(), "data", "program", `block-${block}`, `day-${day}`);
  if (!existsSync(dayDir)) return null;

  for (const filename of readdirSync(dayDir)) {
    if (!filename.endsWith(".md") || filename.endsWith(".zh.md")) continue;
    const filepath = join(dayDir, filename);
    try {
      const { data } = matter(readFileSync(filepath, "utf8"));
      if (data.type === "devotional" && data.category === category) {
        return filepath;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

/** Replace only the body of an EN .md file, preserving frontmatter verbatim. */
function replaceENBody(filepath: string, newBody: string): void {
  const original = readFileSync(filepath, "utf8");

  // Match the frontmatter block (everything between the two --- fences)
  const fmEnd = original.indexOf("\n---", 3);
  if (fmEnd === -1) {
    console.warn(`  ⚠ Could not find frontmatter end in ${filepath} — skipping`);
    return;
  }

  const frontmatter = original.substring(0, fmEnd + 4); // include closing ---
  const updated = frontmatter + "\n\n" + newBody;

  if (dryRun) {
    console.log(`  [dry-run] would write ${filepath}`);
    console.log("  --- first 400 chars of new body ---");
    console.log(newBody.substring(0, 400));
    console.log("  ---");
  } else {
    writeFileSync(filepath, updated);
  }
}

/**
 * Update name.en or name.zh in an EN .md file's frontmatter without touching
 * any other field. Uses a targeted regex so YAML formatting is preserved.
 */
function updateFrontmatterTitle(
  filepath: string,
  field: "en" | "zh",
  title: string,
): void {
  const content = readFileSync(filepath, "utf8");
  const re = new RegExp(`^(\\s+${field}:\\s*").*?("\\s*)$`, "m");
  if (!re.test(content)) {
    console.warn(`  ⚠ Could not find name.${field} in ${filepath}`);
    return;
  }
  const safe = title.replace(/"/g, '\\"');
  const updated = content.replace(re, `$1${safe}$2`);
  if (updated !== content && !dryRun) writeFileSync(filepath, updated);
}

/** Replace (or write) a ZH .zh.md file (no frontmatter, body only). */
function replaceZHBody(filepath: string, newBody: string): void {
  if (!existsSync(filepath)) {
    console.warn(`  ⚠ ZH file not found: ${filepath}`);
    return;
  }

  if (dryRun) {
    console.log(`  [dry-run] would write ${filepath}`);
    console.log("  --- first 400 chars of new body ---");
    console.log(newBody.substring(0, 400));
    console.log("  ---");
  } else {
    writeFileSync(filepath, newBody);
  }
}

// ---------------------------------------------------------------------------
// Apply parsed days to files
// ---------------------------------------------------------------------------

function applyDays(
  days: ParsedDay[],
  category: "Mental" | "Emotional",
  lang: "en" | "zh",
): void {
  let updated = 0;
  let skipped = 0;

  for (const day of days) {
    const enFile = findDevotionalFile(block, day.day, category);
    if (!enFile) {
      console.warn(`  ⚠ No ${category} devotional file for block ${block} day ${day.day}`);
      skipped++;
      continue;
    }

    const body = buildBody(day);

    if (lang === "en") {
      console.log(`  → day ${day.day}: ${enFile.split("/").slice(-3).join("/")}`);
      replaceENBody(enFile, body);
      if (day.title) updateFrontmatterTitle(enFile, "en", day.title);
      updated++;
    } else {
      const zhFile = enFile.replace(/\.md$/, ".zh.md");
      console.log(`  → day ${day.day}: ${zhFile.split("/").slice(-3).join("/")}`);
      replaceZHBody(zhFile, body);
      if (day.title) updateFrontmatterTitle(enFile, "zh", day.title);
      updated++;
    }
  }

  console.log(`  ${updated} file(s) updated, ${skipped} skipped`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

(async () => {
  if (mentalEnFile) {
    console.log(`\nProcessing mental EN: ${mentalEnFile}`);
    const text = await extractText(mentalEnFile);
    const days = parseMental(text, EN_MENTAL_LABELS);
    console.log(`  Parsed ${days.length} days`);
    applyDays(days, "Mental", "en");
  }

  if (mentalZhFile) {
    console.log(`\nProcessing mental ZH: ${mentalZhFile}`);
    const text = await extractText(mentalZhFile);
    const days = parseMental(text, ZH_MENTAL_LABELS);
    console.log(`  Parsed ${days.length} days`);
    applyDays(days, "Mental", "zh");
  }

  if (emotionalEnFile) {
    console.log(`\nProcessing emotional EN: ${emotionalEnFile}`);
    const text = await extractText(emotionalEnFile);
    const days = parseEmotionalEN(text);
    console.log(`  Parsed ${days.length} days`);
    applyDays(days, "Emotional", "en");
  }

  if (emotionalZhFile) {
    console.log(`\nProcessing emotional ZH: ${emotionalZhFile}`);
    const text = await extractText(emotionalZhFile);
    const days = parseEmotionalZH(text);
    console.log(`  Parsed ${days.length} days`);
    applyDays(days, "Emotional", "zh");
  }

  console.log("\nDone.");
})();
