import { env } from "@/src/env";

export const BLOCK_LENGTH_DAYS = 25;
const BLOCK_LENGTH_MS = BLOCK_LENGTH_DAYS * 86_400_000;
const DAY_MS = 86_400_000;

// Day boundaries — block launches, the active-block switchover, and daily
// rollover — happen at the USER's local midnight, using their device timezone
// (IANA name from the `tz` cookie). When the device tz is unknown (first server
// render before the cookie is set, or background jobs), fall back to this
// default. The audience is UTC+8, so this keeps boundaries sane until the real
// tz arrives.
export const PROGRAM_DEFAULT_TZ = "Asia/Kuala_Lumpur";

// The most permissive timezone (UTC+14). Used by the global content-lock gate so
// a block is considered released as soon as its launch date has begun ANYWHERE
// on earth — no real user is ever wrongly blocked; the page layer still gates the
// exact per-user local-midnight reveal.
export const EARLIEST_TZ = "Pacific/Kiritimati";

function safeTz(tz: string): string {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return tz;
  } catch {
    return PROGRAM_DEFAULT_TZ;
  }
}

/**
 * The wall-clock calendar date of `instant` in `tz`, represented as a UTC-midnight
 * marker (e.g. July 5 -> 2026-07-05T00:00:00Z), so `.toISOString().slice(0,10)`
 * renders the right label and day arithmetic is timezone-agnostic from here on.
 */
function localDateMarker(instant: Date, tz: string): Date {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTz(tz),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(instant)
    .split("-")
    .map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Whole-day index of a UTC-midnight date marker, for day-diffing. */
function epochDay(marker: Date): number {
  return Math.round(marker.getTime() / DAY_MS);
}

/**
 * Global launch dates per 1-indexed block (UTC-midnight marker of the calendar
 * date). A block's content is LOCKED until its launch date arrives in the user's
 * local timezone, and no user enters it earlier.
 *
 * To schedule a future block, add an entry. To delay/lock one, raise its date.
 * A block with NO entry has no launch gate — it opens as soon as a user finishes
 * the previous block (use this when blocks should run back-to-back).
 *
 * Dev tip: to preview a future block for cosmetic work, temporarily lower its
 * date here (e.g. set `2` to a past date) so the active block advances.
 */
export const BLOCK_LAUNCH: Record<number, Date> = {
  // Launch dates are calendar dates; resolved via the default tz only to extract
  // the intended day from the source string (env value carries a +08:00 offset).
  1: localDateMarker(new Date(env.PROGRAM_START_AT), PROGRAM_DEFAULT_TZ), // June 1, 2026
  2: localDateMarker(new Date("2026-07-06"), PROGRAM_DEFAULT_TZ), // block 2 launch
  // 3: localDateMarker(new Date("2026-08-09"), PROGRAM_DEFAULT_TZ), // add when scheduled
};

export function getBlockLaunchDate(blockNumber: number): Date | null {
  return BLOCK_LAUNCH[blockNumber] ?? null;
}

/**
 * Day counter within a block, on the user's local calendar-day boundaries (rolls
 * over at their local midnight). Clamped to [1, BLOCK_LENGTH_DAYS].
 */
export function getCurrentDay(
  blockStart: Date,
  now: Date = new Date(),
  tz: string = PROGRAM_DEFAULT_TZ,
): number {
  const daysElapsed = epochDay(localDateMarker(now, tz)) - epochDay(blockStart);
  return Math.min(Math.max(daysElapsed + 1, 1), BLOCK_LENGTH_DAYS);
}

/** Block-1 start for a user: their local onboarding date, floored to block 1's launch. */
export function getEffectiveStart(onboardedAt: Date, tz: string = PROGRAM_DEFAULT_TZ): Date {
  const floor = BLOCK_LAUNCH[1];
  const onboardDate = localDateMarker(onboardedAt, tz);
  return onboardDate.getTime() < floor.getTime() ? floor : onboardDate;
}

/**
 * UTC-midnight marker of block N's start for a user: `max(finish previous block
 * personally, the block's global launch date)`. Generalises to N blocks.
 */
export function getBlockStart(
  onboardedAt: Date,
  blockNumber: number,
  tz: string = PROGRAM_DEFAULT_TZ,
): Date {
  if (blockNumber <= 1) return getEffectiveStart(onboardedAt, tz);
  const personalEarliest = new Date(
    getBlockStart(onboardedAt, blockNumber - 1, tz).getTime() + BLOCK_LENGTH_MS,
  );
  const launch = getBlockLaunchDate(blockNumber);
  return launch && launch.getTime() > personalEarliest.getTime() ? launch : personalEarliest;
}

export interface ActiveBlock {
  blockNumber: number; // 1-indexed
  blockStart: Date; // UTC-midnight marker of the active block's day 1
  currentDay: number; // 1..BLOCK_LENGTH_DAYS within the active block
  effectiveStart: Date; // block-1 start (UTC-midnight marker)
}

/**
 * Canonical "where is this user right now" — the ONLY place block boundaries are
 * decided. The active block is the highest one whose start has arrived for this
 * user (their own 25-day pacing, floored to each block's global launch date),
 * evaluated on their local calendar days.
 */
export function getActiveBlock(
  onboardedAt: Date,
  now: Date = new Date(),
  tz: string = PROGRAM_DEFAULT_TZ,
): ActiveBlock {
  const effectiveStart = getEffectiveStart(onboardedAt, tz);
  const today = epochDay(localDateMarker(now, tz));
  let blockNumber = 1;
  // Advance while the NEXT block has already started (in the user's local days).
  while (epochDay(getBlockStart(onboardedAt, blockNumber + 1, tz)) <= today) {
    blockNumber++;
  }
  const blockStart = getBlockStart(onboardedAt, blockNumber, tz);
  return {
    blockNumber,
    blockStart,
    currentDay: getCurrentDay(blockStart, now, tz),
    effectiveStart,
  };
}

/** True once a block's content is released in the given timezone (no entry = always released). */
export function isBlockReleased(
  blockNumber: number,
  now: Date = new Date(),
  tz: string = PROGRAM_DEFAULT_TZ,
): boolean {
  const launch = getBlockLaunchDate(blockNumber);
  return !launch || epochDay(localDateMarker(now, tz)) >= epochDay(launch);
}
