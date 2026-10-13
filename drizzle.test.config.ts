import { defineConfig } from "drizzle-kit";
import { loadTestDatabaseEnvironment } from "./scripts/e2e-environment";

// Check only the database target. Browser-test service settings do not apply here.
const settings = loadTestDatabaseEnvironment();

export default defineConfig({
  out: "./drizzle/migrations",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  casing: "snake_case",
  schemaFilter: ["nhp"],
  dbCredentials: {
    url: settings.DATABASE_URL,
  },
});
