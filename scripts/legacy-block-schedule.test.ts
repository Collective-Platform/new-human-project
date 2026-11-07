import assert from "node:assert/strict";
import { test } from "node:test";
import { legacyActiveBlock, legacyBlockEnd, legacyBlockStart } from "./legacy-block-schedule";

// A member who onboarded on or before the program start (June 1, 2026).
const ONBOARDED = new Date("2026-05-20T04:00:00.000Z");
const day = (iso: string) => legacyBlockStart(ONBOARDED, Number(iso)).toISOString().slice(0, 10);

test("block start dates match the old launch schedule", () => {
  assert.equal(day("1"), "2026-06-01");
  assert.equal(day("2"), "2026-07-06");
  assert.equal(day("3"), "2026-07-31");
  assert.equal(day("6"), "2026-10-14");
  // Block 7 had no launch date: it starts 25 days after block 6.
  assert.equal(day("7"), "2026-11-08");
});

test("a block ends 25 days after it starts", () => {
  assert.equal(legacyBlockEnd(ONBOARDED, 1).toISOString().slice(0, 10), "2026-06-26");
  assert.equal(legacyBlockEnd(ONBOARDED, 5).toISOString().slice(0, 10), "2026-10-14");
});

test("on Nov 7 a member who onboarded by June 1 is on block 6, Day 25", () => {
  const active = legacyActiveBlock(ONBOARDED, new Date("2026-11-07T04:00:00.000Z"));
  assert.equal(active.blockNumber, 6);
  assert.equal(active.currentDay, 25);
});

test("a member who onboarded after launch starts block 2 on the later of the two dates", () => {
  // Onboarded Aug 1: block 1 ends Aug 26, after block 2's launch of Jul 6.
  const late = new Date("2026-08-01T04:00:00.000Z");
  assert.equal(legacyBlockStart(late, 2).toISOString().slice(0, 10), "2026-08-26");
});
