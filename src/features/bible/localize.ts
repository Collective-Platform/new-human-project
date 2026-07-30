const ZH_BOOK_NAMES: Record<string, string> = {
  genesis: "创世记",
  exodus: "出埃及记",
  psalm: "诗篇",
  psalms: "诗篇",
  isaiah: "以赛亚书",
  ezekiel: "以西结书",
  luke: "路加福音",
  john: "约翰福音",
  acts: "使徒行传",
  romans: "罗马书",
  "1corinthians": "哥林多前书",
  "2corinthians": "哥林多后书",
  galatians: "加拉太书",
  ephesians: "以弗所书",
  colossians: "歌罗西书",
  "1thessalonians": "帖撒罗尼迦前书",
  philippians: "腓立比书",
  matthew: "马太福音",
  hebrews: "希伯来书",
  "2timothy": "提摩太后书",
  "1peter": "彼得前书",
  "1john": "约翰一书",
  revelation: "启示录",
};

/**
 * Translate a human-readable scripture reference like "Ephesians 1:1-14" or "Acts 19"
 * into the locale's language. Falls back to the original reference if no translation exists.
 * Safe to import from client components — has no server-side dependencies.
 */
export function localizeScriptureRef(reference: string, locale: string): string {
  if (locale !== "zh") return reference;
  const parts = reference.split(" · ");
  if (parts.length > 1) {
    return parts.map((p) => localizeScriptureRef(p, locale)).join(" · ");
  }
  const m = reference.trim().match(/^([1-3]?\s*[A-Za-z]+)(\s+.+)?$/);
  if (!m) return reference;
  const bookKey = m[1].replace(/\s+/g, "").toLowerCase();
  const zhBook = ZH_BOOK_NAMES[bookKey];
  if (!zhBook) return reference;
  return zhBook + (m[2] ?? "");
}
