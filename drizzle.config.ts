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
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
