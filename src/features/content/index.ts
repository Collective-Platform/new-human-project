/**
 * Resolve a locale-keyed JSONB field to a string.
 *
 * Fallback chain: requested locale → "en" → first available locale → ""
 */
export function getLocalizedString(field: unknown, locale: string): string {
  if (typeof field === "string") return field;
  if (typeof field === "object" && field !== null) {
    const obj = field as Record<string, string>;
    if (obj[locale]) return obj[locale];
    if (obj.en) return obj.en;
    const keys = Object.keys(obj);
    if (keys.length > 0) return obj[keys[0]];
  }
  return "";
}
