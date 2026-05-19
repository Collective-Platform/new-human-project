const ZH_BOOK_NAMES: Record<string, string> = {
  ephesians: "以弗所书",
  acts: "使徒行传",
};

/**
 * Translate a human-readable scripture reference like "Ephesians 1:1-14" or "Acts 19"
 * into the locale's language. Falls back to the original reference if no translation exists.
 * Safe to import from client components — has no server-side dependencies.
 */
export function localizeScriptureRef(reference: string, locale: string): string {
  if (locale !== "zh") return reference;
  const m = reference.trim().match(/^([1-3]?\s*[A-Za-z]+)(\s+.+)?$/);
  if (!m) return reference;
  const bookKey = m[1].replace(/\s+/g, "").toLowerCase();
  const zhBook = ZH_BOOK_NAMES[bookKey];
  if (!zhBook) return reference;
  return zhBook + (m[2] ?? "");
}
