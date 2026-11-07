import assert from "node:assert/strict";
import { test } from "node:test";
import { getPlanCurrentDay, getPlanDayDate, isPlanPastLastDay } from "../src/features/plans/dates";

// The client counts "today" with UTC getters on the start value, so the server must send a
// UTC-midnight marker of the member's local start date, not the exact start time.
const TZ = "Asia/Kuala_Lumpur";

test("a plan started at 07:00 in Kuala Lumpur sends its local start date", () => {
  // 07:00 in Kuala Lumpur is 23:00 UTC on the day before.
  const startedAt = new Date("2026-03-09T23:00:00.000Z");
  const marker = getPlanDayDate(startedAt, 1, TZ);
  assert.equal(marker.toISOString(), "2026-03-10T00:00:00.000Z");
  // The client reads the marker with UTC getters and must see the local date.
  assert.equal(marker.getUTCDate(), 10);
  // The raw start time would have been read as the 9th, one day behind.
  assert.equal(startedAt.getUTCDate(), 9);
});

test("the client day from the marker matches the server day", () => {
  const startedAt = new Date("2026-03-09T23:00:00.000Z");
  const marker = getPlanDayDate(startedAt, 1, TZ);
  // 10:00 in Kuala Lumpur on the start date.
  const now = new Date("2026-03-10T02:00:00.000Z");
  const todayMs = Date.UTC(2026, 2, 10);
  const clientDay = Math.floor((todayMs - marker.getTime()) / 86_400_000) + 1;
  assert.equal(clientDay, 1);
  assert.equal(getPlanCurrentDay(startedAt, TZ, now), clientDay);
});

test("a plan is past its last day only from the day after Day 25", () => {
  // 09:00 in Kuala Lumpur on March 1, then 24 and 25 days later.
  const startedAt = new Date("2026-03-01T01:00:00.000Z");
  const day25 = new Date("2026-03-25T01:00:00.000Z");
  const dayAfter = new Date("2026-03-26T01:00:00.000Z");
  assert.equal(getPlanCurrentDay(startedAt, TZ, day25), 25);
  assert.equal(isPlanPastLastDay(startedAt, TZ, day25), false);
  assert.equal(getPlanCurrentDay(startedAt, TZ, dayAfter), 25);
  assert.equal(isPlanPastLastDay(startedAt, TZ, dayAfter), true);
});
