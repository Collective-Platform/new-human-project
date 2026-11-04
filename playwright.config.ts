import { defineConfig, devices } from "@playwright/test";
import { loadTestEnvironment } from "./scripts/e2e-environment";

// Listing scenarios needs neither credentials nor a running database.
if (!process.argv.includes("--list")) loadTestEnvironment();

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  outputDir: ".context/test-results",
  reporter: [["list"], ["html", { outputFolder: ".context/playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    timezoneId: "Asia/Kuala_Lumpur",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    serviceWorkers: "block",
  },
  projects: [
    { name: "mobile-chromium", testIgnore: "**/desktop.spec.ts", use: { ...devices["Pixel 7"] } },
    {
      name: "desktop-chromium",
      testMatch: "**/desktop.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm exec next start --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/en/landing",
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
