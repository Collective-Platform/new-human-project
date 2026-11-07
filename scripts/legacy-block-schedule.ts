/**
 * Frozen copy of the old automatic block schedule from `src/lib/program-gate.ts`,
 * before blocks became member-started plans. Only `migrate-legacy-plans.ts` uses it,
 * to work out which block each member was on and when it started.
 *
 * Do not change these dates and do not import them into the app. The live
 * schedule no longer has launch dates for blocks 2 and up, so the migration cannot
 * read the old dates from there.
 */
const DAY_MS = 86_400_000;
const BLOCK_LENGTH_DAYS = 25;
const TZ = "Asia/Kuala_Lumpur";

// Calendar dates as UTC-midnight markers. Block 1 is the program start (June 1, 2026).
// Block 7 and up had no launch date: they started when the member finished the block before.
const LEGACY_LAUNCH: Record<number, number> = {
  1: Date.UTC(2026, 5, 1),
  2: Date.UTC(2026, 6, 6),
  3: Date.UTC(2026, 6, 31),
  4: Date.UTC(2026, 7, 25),
  5: Date.UTC(2026, 8, 19),
  6: Date.UTC(2026, 9, 14),
};

/** The calendar date of `instant` in Kuala Lumpur, as a UTC-midnight timestamp. */
function localDate(instant: Date): number {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(instant)
    .split("-")
    .map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Start date of block N for a member, as a UTC-midnight marker. */
export function legacyBlockStart(onboardedAt: Date, blockNumber: number): Date {
  if (blockNumber <= 1) {
    return new Date(Math.max(localDate(onboardedAt), LEGACY_LAUNCH[1]));
  }
  const personalEarliest =
    legacyBlockStart(onboardedAt, blockNumber - 1).getTime() + BLOCK_LENGTH_DAYS * DAY_MS;
  const launch = LEGACY_LAUNCH[blockNumber];
  return new Date(launch !== undefined && launch > personalEarliest ? launch : personalEarliest);
}

/** The day after block N's last day. The old Completed tab used this as its completed date. */
export function legacyBlockEnd(onboardedAt: Date, blockNumber: number): Date {
  return new Date(
    legacyBlockStart(onboardedAt, blockNumber).getTime() + BLOCK_LENGTH_DAYS * DAY_MS,
  );
}

/** The block the member was on under the old schedule, and the day within it. */
export function legacyActiveBlock(onboardedAt: Date, now: Date = new Date()) {
  const today = Math.round(localDate(now) / DAY_MS);
  let blockNumber = 1;
  while (Math.round(legacyBlockStart(onboardedAt, blockNumber + 1).getTime() / DAY_MS) <= today) {
    blockNumber++;
  }
  const blockStart = legacyBlockStart(onboardedAt, blockNumber);
  const daysElapsed = today - Math.round(blockStart.getTime() / DAY_MS);
  const currentDay = Math.min(Math.max(daysElapsed + 1, 1), BLOCK_LENGTH_DAYS);
  return { blockNumber, blockStart, currentDay };
}
