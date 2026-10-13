import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";

export function loadTestDatabaseEnvironment() {
  if (!existsSync(".env.test.local")) {
    throw new Error(
      "Create .env.test.local from tests/e2e/env.example first. No database was changed.",
    );
  }
  const settings = parse(readFileSync(".env.test.local"));
  let url: URL;
  try {
    url = new URL(settings.DATABASE_URL);
  } catch {
    throw new Error(".env.test.local must contain a valid PostgreSQL DATABASE_URL.");
  }
  if (
    settings.DATABASE_PROVIDER !== "local" ||
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    decodeURIComponent(url.pathname) !== "/rhythm_test" ||
    url.search
  ) {
    throw new Error("Tests require local PostgreSQL database rhythm_test.");
  }
  return settings;
}

// This runs before src/env.ts and before Next.js loads any development settings.
export function loadTestEnvironment() {
  const settings = loadTestDatabaseEnvironment();
  if (!settings.SESSION_SECRET) {
    throw new Error("Browser tests require a test SESSION_SECRET.");
  }

  const disabled = [
    "MAILERSEND_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "GOOGLE_SERVICE_ACCOUNT_EMAIL",
    "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
    "LIVE_TRACK_SHEET_ID",
    "VAPID_PUBLIC_KEY",
    "VAPID_PRIVATE_KEY",
    "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
    "CRON_SECRET",
    "COOKIE_DOMAIN",
  ];
  for (const key of disabled) {
    if (settings[key]) throw new Error(`Remove ${key} from .env.test.local for browser tests.`);
  }
  // Mask all keys in normal env files so Next.js cannot fill omitted test keys with secrets.
  for (const file of [".env", ".env.local", ".env.production", ".env.production.local"]) {
    if (!existsSync(file)) continue;
    const normal = parse(readFileSync(file));
    if (normal.DATABASE_URL) {
      const normalUrl = new URL(normal.DATABASE_URL);
      if (decodeURIComponent(normalUrl.pathname) === "/rhythm_test") {
        throw new Error(
          "rhythm_test is also configured in a normal env file. Use a separate database.",
        );
      }
    }
    for (const key of Object.keys(normal)) process.env[key] = "";
  }
  Object.assign(process.env, {
    PROGRAM_START_AT: "2026-06-01T00:00:00+08:00",
    YVP_BIBLE_ID_EN: "111",
    YVP_BIBLE_ID_ZH: "43",
    // Bible text is loaded on the server, including when opening progress.
    // Use only the explicit test key; never inherit a development key.
    YVP_APP_KEY: "",
    MAILERSEND_FROM_EMAIL: "noreply@example.invalid",
    EMAIL_DELIVERY_MODE: "immediate",
    ...settings,
    ...Object.fromEntries(disabled.map((key) => [key, ""])),
  });
  // Keep the app build and server in the same mode as production.
  Object.assign(process.env, { NODE_ENV: "production" });
  return settings;
}
