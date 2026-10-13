import { env } from "@/src/env";

/**
 * Map of book names (lowercase, no spaces) to USFM book codes.
 * Add the book here whenever new program content references it.
 */
const BOOK_TO_USFM: Record<string, string> = {
  genesis: "GEN",
  exodus: "EXO",
  psalm: "PSA",
  psalms: "PSA",
  isaiah: "ISA",
  ezekiel: "EZK",
  daniel: "DAN",
  matthew: "MAT",
  mark: "MRK",
  luke: "LUK",
  john: "JHN",
  acts: "ACT",
  romans: "ROM",
  "1corinthians": "1CO",
  "2corinthians": "2CO",
  hebrews: "HEB",
  galatians: "GAL",
  ephesians: "EPH",
  colossians: "COL",
  "1thessalonians": "1TH",
  philippians: "PHP",
  "1peter": "1PE",
  "1john": "1JN",
  revelation: "REV",
};

/**
 * Last verse of chapters that start a cross-chapter reference. YouVersion
 * rejects cross-chapter ranges, so we split them into one passage per chapter.
 * Add the chapter here whenever new program content needs it.
 */
const CHAPTER_LAST_VERSE: Record<string, number> = {
  "COL.3": 25,
  "PHP.3": 21,
};

/**
 * Parse a human-readable reference like "Ephesians 1:1-14" or "Ephesians 1:3"
 * into USFM passage_ids like ["EPH.1.1-14"] or ["EPH.1.3"].
 * A cross-chapter reference like "Colossians 3:18-4:1" is split into one
 * passage per chapter: ["COL.3.18-25", "COL.4.1"].
 */
export function referenceToUsfm(reference: string): string[] | null {
  const trimmed = reference.trim();

  // Whole-chapter reference: "Acts 19"
  const chapterMatch = trimmed.match(/^([1-3]?\s*[A-Za-z]+)\s+(\d+)$/);
  if (chapterMatch) {
    const [, bookRaw, chapter] = chapterMatch;
    const usfmBook = BOOK_TO_USFM[bookRaw.replace(/\s+/g, "").toLowerCase()];
    if (!usfmBook) return null;
    return [`${usfmBook}.${chapter}`];
  }

  // Cross-chapter verse range: "Philippians 3:15-4:1"
  const crossChapterMatch = trimmed.match(/^([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)\s*-\s*(\d+):(\d+)$/);
  if (crossChapterMatch) {
    const [, bookRaw, startChapter, startVerse, endChapter, endVerse] = crossChapterMatch;
    const usfmBook = BOOK_TO_USFM[bookRaw.replace(/\s+/g, "").toLowerCase()];
    if (!usfmBook) return null;
    const lastVerse = CHAPTER_LAST_VERSE[`${usfmBook}.${startChapter}`];
    if (!lastVerse) return null;
    return [
      `${usfmBook}.${startChapter}.${startVerse}-${lastVerse}`,
      endVerse === "1" ? `${usfmBook}.${endChapter}.1` : `${usfmBook}.${endChapter}.1-${endVerse}`,
    ];
  }

  // Verse reference: "Ephesians 1:1-2" or "Ephesians 1:1"
  const verseMatch = trimmed.match(/^([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)(?:\s*-\s*(\d+))?$/);
  if (!verseMatch) return null;
  const [, bookRaw, chapter, startVerse, endVerse] = verseMatch;
  const usfmBook = BOOK_TO_USFM[bookRaw.replace(/\s+/g, "").toLowerCase()];
  if (!usfmBook) return null;
  return [
    endVerse
      ? `${usfmBook}.${chapter}.${startVerse}-${endVerse}`
      : `${usfmBook}.${chapter}.${startVerse}`,
  ];
}

export interface PassageResult {
  reference: string;
  content: string;
}

/**
 * Fetch a Bible passage from the YouVersion API.
 * Cached at the platform layer for 24h since scripture text is immutable.
 */
async function fetchPassage(bibleId: string, usfm: string): Promise<PassageResult | null> {
  if (!env.YVP_APP_KEY) {
    throw new Error("YVP_APP_KEY is not configured");
  }
  const url = `https://api.youversion.com/v1/bibles/${bibleId}/passages/${usfm}?format=html`;
  const res = await fetch(url, {
    headers: { "X-YVP-App-Key": env.YVP_APP_KEY },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[bible] YouVersion ${res.status} for bible ${bibleId} passage ${usfm}: ${body}`);
    return null;
  }
  const data = (await res.json()) as { reference?: string; content?: string };
  if (typeof data.content !== "string") return null;
  return {
    reference: data.reference ?? "",
    content: data.content,
  };
}

/**
 * Fetch every USFM part of a reference and join them into one passage.
 * Returns null if any part fails.
 */
async function fetchPassageParts(
  bibleId: string,
  usfmParts: string[],
): Promise<PassageResult | null> {
  const parts = await Promise.all(usfmParts.map((usfm) => fetchPassage(bibleId, usfm)));
  if (parts.some((part) => part === null)) return null;
  const passages = parts as PassageResult[];
  if (passages.length === 1) return passages[0];
  return {
    reference: passages.map((part) => part.reference).join("; "),
    content: passages.map((part) => part.content).join(""),
  };
}

export { localizeScriptureRef } from "./localize";

export interface BilingualPassage {
  en: PassageResult | null;
  zh: PassageResult | null;
}

/**
 * Fetch a passage in both English and Chinese for a human-readable reference.
 */
export async function getBilingualPassage(reference: string): Promise<BilingualPassage | null> {
  const usfm = referenceToUsfm(reference);
  if (!usfm) return null;
  const [en, zh] = await Promise.all([
    fetchPassageParts(env.YVP_BIBLE_ID_EN, usfm),
    fetchPassageParts(env.YVP_BIBLE_ID_ZH, usfm),
  ]);
  return { en, zh };
}

/**
 * Fetch a passage in a single locale.
 */
export async function getPassageForLocale(
  reference: string,
  locale: "en" | "zh",
): Promise<PassageResult | null> {
  const usfm = referenceToUsfm(reference);
  if (!usfm) return null;
  const bibleId = locale === "zh" ? env.YVP_BIBLE_ID_ZH : env.YVP_BIBLE_ID_EN;
  return fetchPassageParts(bibleId, usfm);
}
