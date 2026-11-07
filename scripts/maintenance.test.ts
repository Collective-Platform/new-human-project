import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

// The maintenance window closes pages, server actions and API routes. Needs no server or database.
const SITE = "https://rhythm.you";
const SECRET = "test-secret";

function on(secret: string | undefined = SECRET) {
  process.env.MAINTENANCE_MODE = "1";
  if (secret) process.env.MAINTENANCE_BYPASS_SECRET = secret;
}

afterEach(() => {
  delete process.env.MAINTENANCE_MODE;
  delete process.env.MAINTENANCE_BYPASS_SECRET;
});

const request = (path: string, init: { method?: string; cookie?: string; host?: string } = {}) =>
  new NextRequest(`${SITE}${path}`, {
    method: init.method ?? "GET",
    headers: {
      host: init.host ?? "rhythm.you",
      ...(init.cookie ? { cookie: init.cookie } : {}),
    },
  });

test("with the switch off, pages and API routes work as normal", () => {
  assert.notEqual(proxy(request("/en/landing")).status, 503);
  const api = proxy(request("/api/feed"));
  assert.notEqual(api.status, 503);
  assert.equal(api.headers.get("x-middleware-next"), "1");
});

test("with the switch on, a page shows the notice in both languages", async () => {
  on();
  const response = proxy(request("/en/progress", { cookie: "__session=member" }));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("retry-after"), "3600");
  assert.equal(response.headers.get("cache-control"), "no-store");
  const html = await response.text();
  assert.match(html, /paused for an update/);
  assert.match(html, /暂时无法使用/);
});

test("with the switch on, server actions and API routes are closed, including cron jobs", async () => {
  on();
  assert.equal(proxy(request("/en/progress/abc", { method: "POST" })).status, 503);
  for (const path of ["/api/feed", "/api/auth/otp/request", "/api/cron/send-pending-otps"]) {
    const response = proxy(request(path));
    assert.equal(response.status, 503, path);
    assert.deepEqual(await response.json(), { error: "Maintenance" });
  }
});

test("the Rhythm Live event pages stay open", () => {
  on();
  assert.notEqual(proxy(request("/", { host: "live.rhythm.you" })).status, 503);
  assert.notEqual(proxy(request("/live")).status, 503);
  assert.notEqual(proxy(request("/en/live")).status, 503);
  assert.equal(proxy(request("/en/liveness")).status, 503);
});

test("the secret link sets a cookie and removes the secret from the URL", () => {
  on();
  const response = proxy(request(`/en/progress?day=2&maintenance_bypass=${SECRET}`));
  assert.equal(response.headers.get("location"), `${SITE}/en/progress?day=2`);
  const cookie = response.headers.get("set-cookie") ?? "";
  assert.match(cookie, /maintenance_bypass=test-secret/);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /Secure/i);
});

test("the bypass cookie passes, and a wrong secret does not", () => {
  on();
  assert.notEqual(
    proxy(request("/en/landing", { cookie: `maintenance_bypass=${SECRET}` })).status,
    503,
  );
  assert.notEqual(
    proxy(request("/api/feed", { cookie: `maintenance_bypass=${SECRET}` })).status,
    503,
  );
  assert.equal(proxy(request("/en/landing?maintenance_bypass=wrong")).status, 503);
  assert.equal(proxy(request("/en/landing", { cookie: "maintenance_bypass=wrong" })).status, 503);
});

test("with no secret set, nothing can bypass the notice", () => {
  process.env.MAINTENANCE_MODE = "1";
  assert.equal(proxy(request("/en/landing?maintenance_bypass=")).status, 503);
  assert.equal(proxy(request("/en/landing", { cookie: "maintenance_bypass=" })).status, 503);
});
