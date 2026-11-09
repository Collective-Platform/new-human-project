/** "November 2026" in the member's language. `monthStartDate` is YYYY-MM-DD. */
export function formatMonthLabel(monthStartDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(monthStartDate + "T00:00:00Z"));
}
