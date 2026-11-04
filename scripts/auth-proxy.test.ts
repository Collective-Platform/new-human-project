import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

test("a stale session cookie does not block login or signup in either locale", () => {
  for (const locale of ["en", "zh"]) {
    for (const route of ["login", "signup", "login/verify", "signup/verify"]) {
      const request = new NextRequest(`http://localhost:3000/${locale}/${route}`, {
        headers: { cookie: "__session=session-from-another-database.token" },
      });
      assert.equal(proxy(request).headers.get("location"), null, request.nextUrl.pathname);
    }
    const request = new NextRequest(`http://localhost:3000/${locale}/progress`);
    assert.equal(proxy(request).headers.get("location"), `http://localhost:3000/${locale}/login`);
  }
});
