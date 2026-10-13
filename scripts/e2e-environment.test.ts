import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { loadTestDatabaseEnvironment, loadTestEnvironment } from "./e2e-environment";

test("browser and migration environments refuse unsafe databases and mask development credentials", async () => {
  const originalDirectory = process.cwd();
  const originalEnvironment = { ...process.env };
  const directory = mkdtempSync(join(tmpdir(), "rhythm-e2e-env-"));
  process.chdir(directory);
  const settings = (url: string, extra = "") =>
    writeFileSync(
      ".env.test.local",
      `DATABASE_PROVIDER=local\nDATABASE_URL=${url}\nSESSION_SECRET=test-only\n${extra}`,
    );
  try {
    assert.throws(loadTestEnvironment, /Create .env.test.local/);
    assert.throws(loadTestDatabaseEnvironment, /Create .env.test.local/);
    for (const url of [
      "postgres://localhost:5432/new_human_dev",
      "postgres://remote.example:5432/rhythm_test",
      "postgres://localhost:5432/rhythm_test?options=unsafe",
    ]) {
      settings(url);
      assert.throws(loadTestEnvironment, /Tests require local PostgreSQL/);
      assert.throws(loadTestDatabaseEnvironment, /Tests require local PostgreSQL/);
    }
    settings("postgres://localhost:5432/rhythm_test", "MAILERSEND_API_KEY=unsafe");
    assert.throws(loadTestEnvironment, /Remove MAILERSEND_API_KEY/);
    settings("postgres://localhost:5432/rhythm_test");
    writeFileSync(".env.local", "DATABASE_URL=postgres://localhost/rhythm_test");
    assert.throws(loadTestEnvironment, /Use a separate database/);
    writeFileSync(
      ".env.local",
      "DATABASE_URL=postgres://localhost/new_human_dev\nMAILERSEND_API_KEY=development\nNEXT_PUBLIC_OTHER_KEY=development\nPROGRAM_START_AT=wrong",
    );
    process.env.STRIPE_SECRET_KEY = "inherited";
    process.env.DATABASE_URL = "postgres://live.example/live";
    loadTestEnvironment();
    assert.equal(process.env.DATABASE_URL, "postgres://localhost:5432/rhythm_test");
    assert.equal(process.env.MAILERSEND_API_KEY, "");
    assert.equal(process.env.STRIPE_SECRET_KEY, "");
    assert.equal(process.env.NEXT_PUBLIC_OTHER_KEY, "");
    assert.equal(process.env.PROGRAM_START_AT, "2026-06-01T00:00:00+08:00");
    assert.equal(process.env.NODE_ENV, "production");
    assert.equal(process.env.YVP_APP_KEY, "");
    settings("postgres://localhost:5432/rhythm_test", "YVP_APP_KEY=test-youversion-key");
    loadTestEnvironment();
    assert.equal(process.env.YVP_APP_KEY, "test-youversion-key");
    writeFileSync(
      ".env.test.local",
      "DATABASE_PROVIDER=local\nDATABASE_URL=postgres://localhost:5432/rhythm_test\nYVP_APP_KEY=test-youversion-key\nMAILERSEND_API_KEY=test-mail-key",
    );
    process.env.DATABASE_URL = "postgres://live.example/live";
    const { default: migrationConfig } = await import("../drizzle.test.config");
    assert.ok("dbCredentials" in migrationConfig);
    assert.deepEqual(migrationConfig.dbCredentials, {
      url: "postgres://localhost:5432/rhythm_test",
    });
    assert.equal(migrationConfig.out, "./drizzle/migrations");
    assert.deepEqual(migrationConfig.schemaFilter, ["nhp"]);
    assert.equal(process.env.DATABASE_URL, "postgres://live.example/live");
  } finally {
    process.chdir(originalDirectory);
    process.env = originalEnvironment;
    rmSync(directory, { recursive: true, force: true });
  }
});
