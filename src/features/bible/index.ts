import { env } from "@/src/env";

/**
 * Map of book names (lowercase, no spaces) to USFM book codes.
 * Currently only includes the books used in Phase 1 content. Extend as needed.
 */
const BOOK_TO_USFM: Record<string, string> = {
  ephesians: "EPH",
};

/**
 * Parse a human-readable reference like "Ephesians 1:1-14" or "Ephesians 1:3"
 * into a USFM passage_id like "EPH.1.1-14" or "EPH.1.3".
 */
export function referenceToUsfm(reference: string): string | null {
  const trimmed = reference.trim();
  // Capture: book name, chapter, start verse, optional end verse
  const match = trimmed.match(
    /^([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)(?:\s*-\s*(\d+))?$/,
  );
  if (!match) return null;
  const [, bookRaw, chapter, startVerse, endVerse] = match;
  const bookKey = bookRaw.replace(/\s+/g, "").toLowerCase();
  const usfmBook = BOOK_TO_USFM[bookKey];
  if (!usfmBook) return null;
  return endVerse
    ? `${usfmBook}.${chapter}.${startVerse}-${endVerse}`
    : `${usfmBook}.${chapter}.${startVerse}`;
}

export interface PassageResult {
  reference: string;
  content: string;
}

/**
 * Fetch a Bible passage from the YouVersion API.
 * Cached at the platform layer for 24h since scripture text is immutable.
 */
async function fetchPassage(
  bibleId: string,
  usfm: string,
): Promise<PassageResult | null> {
  if (!env.YVP_APP_KEY) {
    throw new Error("YVP_APP_KEY is not configured");
  }
  const url = `https://api.youversion.com/v1/bibles/${bibleId}/passages/${usfm}`;
  const res = await fetch(url, {
    headers: { "X-YVP-App-Key": env.YVP_APP_KEY },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `[bible] YouVersion ${res.status} for bible ${bibleId} passage ${usfm}: ${body}`,
    );
    return null;
  }
  const data = (await res.json()) as { reference?: string; content?: string };
  if (typeof data.content !== "string") return null;
  return {
    reference: data.reference ?? "",
    content: data.content,
  };
}

export interface BilingualPassage {
  en: PassageResult | null;
  zh: PassageResult | null;
}

/**
 * Fetch a passage in both English and Chinese for a human-readable reference.
 */
export async function getBilingualPassage(
  reference: string,
): Promise<BilingualPassage | null> {
  const usfm = referenceToUsfm(reference);
  if (!usfm) return null;
  const [en, zh] = await Promise.all([
    fetchPassage(env.YVP_BIBLE_ID_EN, usfm),
    fetchPassage(env.YVP_BIBLE_ID_ZH, usfm),
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
  return fetchPassage(bibleId, usfm);
}
