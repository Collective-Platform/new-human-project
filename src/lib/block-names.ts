const BLOCK_NAMES = {
  1: { en: "Ephesians", zh: "以弗所书" },
  2: { en: "Philippians", zh: "腓立比书" },
  3: { en: "The Holy Spirit", zh: "圣灵" },
  4: { en: "Romans", zh: "罗马书" },
} as const;

/** The canonical member-facing label for a numbered program block. */
export function getBlockLabel(blockNumber: number, locale: "en" | "zh"): string {
  const prefix = locale === "zh" ? `计划 ${blockNumber}` : `Block ${blockNumber}`;
  const name = BLOCK_NAMES[blockNumber as keyof typeof BLOCK_NAMES]?.[locale];
  return name ? `${prefix} - ${name}` : prefix;
}
