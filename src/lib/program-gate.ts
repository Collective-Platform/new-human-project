const START_AT = process.env.PROGRAM_START_AT ?? "2026-06-01T00:00:00+08:00";
export const PROGRAM_START_MS = new Date(START_AT).getTime();
export const isProgramLocked = () => Date.now() < PROGRAM_START_MS;

// UTC midnight of the program's first calendar day — used as the effective
// onboardedAt floor for users who signed up before launch.
// e.g. "2026-06-01T00:00:00+08:00" = May 31 16:00 UTC → advances to June 1 00:00 UTC
const _d = new Date(PROGRAM_START_MS);
_d.setUTCHours(0, 0, 0, 0);
if (_d.getTime() < PROGRAM_START_MS) _d.setUTCDate(_d.getUTCDate() + 1);
export const PROGRAM_BLOCK_START = _d;
