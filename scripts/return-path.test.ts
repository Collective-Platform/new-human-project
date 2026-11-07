import assert from "node:assert/strict";
import { test } from "node:test";
import { safeReturnPath, withReturnPath } from "../src/lib/return-path";

/**
 * The login return path comes from the URL, so it must never lead off the invite pages.
 * Needs no server or database.
 *
 *   pnpm exec tsx --test scripts/return-path.test.ts
 */
test("only invite pages are accepted as a return path", () => {
  assert.equal(safeReturnPath("/join/abc_123-XYZ"), "/join/abc_123-XYZ");
  for (const value of [
    null,
    undefined,
    "",
    "/",
    "/admin",
    "/join/",
    "/join/abc/extra",
    "/join/../admin",
    "//evil.example/join/abc",
    "https://evil.example/join/abc",
    "/join/abc?x=1",
    "/join/abc\n",
  ]) {
    assert.equal(safeReturnPath(value), null, String(value));
  }
});

test("the return path is added to a link only when there is one", () => {
  assert.equal(withReturnPath("/login", null), "/login");
  assert.equal(withReturnPath("/login", "/join/abc"), "/login?next=%2Fjoin%2Fabc");
  assert.equal(
    withReturnPath("/signup?email=a", "/join/abc"),
    "/signup?email=a&next=%2Fjoin%2Fabc",
  );
});
