const BLOCK_NAMES = {
  1: { en: "Ephesians", zh: "以弗所书" },
  2: { en: "Philippians", zh: "腓立比书" },
  3: { en: "The Holy Spirit", zh: "圣灵" },
  4: { en: "Romans", zh: "罗马书" },
  5: { en: "Jesus", zh: "耶稣生平" },
  6: { en: "Galatians & Colossians", zh: "加拉太书与歌罗西书" },
  7: { en: "1 Corinthians", zh: "哥林多前书" },
} as const;

/** The canonical member-facing label for a numbered program block. */
export function getBlockLabel(blockNumber: number, locale: "en" | "zh"): string {
  const prefix = locale === "zh" ? `计划 ${blockNumber}` : `Block ${blockNumber}`;
  const name = BLOCK_NAMES[blockNumber as keyof typeof BLOCK_NAMES]?.[locale];
  return name ? `${prefix} - ${name}` : prefix;
}

/** The short name of a numbered program block (e.g. "Ephesians"), or null if it has none. */
export function getBlockName(blockNumber: number, locale: "en" | "zh"): string | null {
  return BLOCK_NAMES[blockNumber as keyof typeof BLOCK_NAMES]?.[locale] ?? null;
}

/** Just the "Block 1" part of the label, without the name. */
export function getBlockPrefix(blockNumber: number, locale: "en" | "zh"): string {
  return locale === "zh" ? `计划 ${blockNumber}` : `Block ${blockNumber}`;
}
