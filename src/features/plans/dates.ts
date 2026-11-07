// Pure plan-day maths. No database import, so tests can load it without env settings.

export const PLAN_LENGTH_DAYS = 25;

function daysSinceStart(startedAt: Date, timezone: string, now: Date): number {
  const start = dateAtTimezone(startedAt, timezone);
  const today = dateAtTimezone(now, timezone);
  return Math.floor((today.getTime() - start.getTime()) / 86_400_000);
}

function dateAtTimezone(date: Date, timezone: string): Date {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    return new Date(Date.UTC(value("year"), value("month") - 1, value("day")));
  } catch {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }
}

/** Each participant advances according to their own local calendar. */
export function getPlanCurrentDay(startedAt: Date, timezone: string, now = new Date()): number {
  const elapsed = daysSinceStart(startedAt, timezone, now);
  return Math.min(Math.max(elapsed + 1, 1), PLAN_LENGTH_DAYS);
}

/** True from the day after Day 25. `getPlanCurrentDay` stops at 25, so it cannot show this. */
export function isPlanPastLastDay(startedAt: Date, timezone: string, now = new Date()): boolean {
  return daysSinceStart(startedAt, timezone, now) >= PLAN_LENGTH_DAYS;
}

/** The calendar date (UTC midnight of the member's local date) that a plan day falls on. */
export function getPlanDayDate(startedAt: Date, day: number, timezone: string): Date {
  const start = dateAtTimezone(startedAt, timezone);
  return new Date(start.getTime() + (day - 1) * 86_400_000);
}

/** Which day of a plan a calendar date is, or null when it falls outside days 1 to 25. */
export function getPlanDayOnDate(startedAt: Date, date: Date, timezone: string): number | null {
  const start = dateAtTimezone(startedAt, timezone);
  const day = Math.round((date.getTime() - start.getTime()) / 86_400_000) + 1;
  return day >= 1 && day <= PLAN_LENGTH_DAYS ? day : null;
}
