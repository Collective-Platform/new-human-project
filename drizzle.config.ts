import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  out: "./drizzle/migrations",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  casing: "snake_case",
  // Only manage NHP's own schema. We share the database instance with
  // giving-platform but never touch its `public` tables.
  schemaFilter: ["nhp"],
  // Migration log. This is the Drizzle default, written out on purpose.
  // The giving-platform app keeps its own log in its own schema, so the two
  // apps do not share migration history. Do not change without moving the rows.
  migrations: {
    schema: "drizzle",
    table: "__drizzle_migrations",
  },
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
