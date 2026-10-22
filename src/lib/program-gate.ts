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
  3: localDateMarker(new Date("2026-07-31"), PROGRAM_DEFAULT_TZ), // block 3 launch
  4: localDateMarker(new Date("2026-08-25"), PROGRAM_DEFAULT_TZ), // block 4 launch
  5: localDateMarker(new Date("2026-09-19"), PROGRAM_DEFAULT_TZ), // block 5 launch
  6: localDateMarker(new Date("2026-10-14"), PROGRAM_DEFAULT_TZ), // block 6 launch
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

/** One stored attempt at a block, with dates as UTC-midnight markers. */
export interface BlockAttempt {
  blockNumber: number;
  attempt: number;
  startsOn: Date; // user's local calendar day the attempt began
  completedAt: Date | null;
}

/** Converts a `YYYY-MM-DD` date string (DB `date` column) to a UTC-midnight marker. */
export function dateStringToMarker(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** The latest attempt per block (highest `attempt`). */
function latestAttempts(attempts: BlockAttempt[]): Map<number, BlockAttempt> {
  const byBlock = new Map<number, BlockAttempt>();
  for (const a of attempts) {
    const prev = byBlock.get(a.blockNumber);
    if (!prev || a.attempt > prev.attempt) byBlock.set(a.blockNumber, a);
  }
  return byBlock;
}

/** An attempt's real start: its stored day, floored to the block's global launch date. */
function attemptStart(a: BlockAttempt): Date {
  const launch = getBlockLaunchDate(a.blockNumber);
  return launch && launch.getTime() > a.startsOn.getTime() ? launch : a.startsOn;
}

/**
 * UTC-midnight marker of block N's start for a user. Uses the stored attempt when
 * there is one; otherwise block 1 starts at onboarding and later blocks fall back
 * to their launch date (a block the user never entered).
 */
export function getBlockStart(
  onboardedAt: Date,
  attempts: BlockAttempt[],
  blockNumber: number,
  tz: string = PROGRAM_DEFAULT_TZ,
): Date {
  const attempt = latestAttempts(attempts).get(blockNumber);
  if (attempt) return attemptStart(attempt);
  if (blockNumber <= 1) return getEffectiveStart(onboardedAt, tz);
  return getBlockLaunchDate(blockNumber) ?? getEffectiveStart(onboardedAt, tz);
}

/**
 * Inclusive end of the date window that counts toward block N (streak, calendar).
 * A block never ends before day 25. Past that it runs until the next block starts
 * (or, for the open/last block, until tomorrow / the completion day).
 */
export function getBlockWindowEnd(
  onboardedAt: Date,
  attempts: BlockAttempt[],
  blockNumber: number,
  now: Date = new Date(),
  tz: string = PROGRAM_DEFAULT_TZ,
): Date {
  const start = getBlockStart(onboardedAt, attempts, blockNumber, tz);
  const minEnd = start.getTime() + BLOCK_LENGTH_MS;
  const byBlock = latestAttempts(attempts);
  const next = byBlock.get(blockNumber + 1);
  if (next) return new Date(Math.max(minEnd, attemptStart(next).getTime()));
  const own = byBlock.get(blockNumber);
  const anchor = own?.completedAt ?? now;
  return new Date(Math.max(minEnd, localDateMarker(anchor, tz).getTime() + DAY_MS));
}

export type BlockState = "active" | "can-complete";

export interface ActiveBlock {
  blockNumber: number; // 1-indexed
  blockStart: Date; // UTC-midnight marker of the active block's day 1
  currentDay: number; // 1..BLOCK_LENGTH_DAYS within the active block (clamped)
  effectiveStart: Date; // block-1 start (UTC-midnight marker)
  completedAt: Date | null; // set once the user pressed "Complete block"
  state: BlockState;
}

/**
 * Canonical "where is this user right now" — the ONLY place block boundaries are
 * decided. The active block is the highest stored attempt whose start has arrived
 * (evaluated on the user's local calendar days). With no attempts the user is in
 * block 1, started at onboarding. Blocks never advance by time alone: the user
 * moves on by completing the block (see `completeBlock`), which is only offered
 * from Day 25 once the next block has content (`maxBlock`) and has launched.
 */
export function getActiveBlock(
  onboardedAt: Date,
  attempts: BlockAttempt[],
  now: Date = new Date(),
  tz: string = PROGRAM_DEFAULT_TZ,
  maxBlock: number = Infinity,
): ActiveBlock {
  const effectiveStart = getEffectiveStart(onboardedAt, tz);
  const today = epochDay(localDateMarker(now, tz));

  let active: BlockAttempt | null = null;
  for (const a of latestAttempts(attempts).values()) {
    if (epochDay(attemptStart(a)) > today) continue;
    if (!active || a.blockNumber > active.blockNumber) active = a;
  }

  const blockNumber = active?.blockNumber ?? 1;
  const blockStart = active ? attemptStart(active) : effectiveStart;
  const completedAt = active?.completedAt ?? null;
  const currentDay = getCurrentDay(blockStart, now, tz);
  const nextOpen = blockNumber + 1 <= maxBlock && isBlockReleased(blockNumber + 1, now, tz);
  const state: BlockState =
    !completedAt && currentDay >= BLOCK_LENGTH_DAYS && nextOpen ? "can-complete" : "active";
  return { blockNumber, blockStart, currentDay, effectiveStart, completedAt, state };
}

/** Local calendar day of `instant` as a UTC-midnight marker (for storing `startsOn`). */
export function getLocalDateMarker(instant: Date, tz: string = PROGRAM_DEFAULT_TZ): Date {
  return localDateMarker(instant, tz);
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
