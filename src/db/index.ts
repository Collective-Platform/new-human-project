import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import pg from "pg";
import { env } from "@/src/env";
import * as schema from "./schema";

// All NHP tables live in the `nhp` Postgres schema. Drizzle-generated queries
// are fully qualified (`"nhp"."users"`) thanks to `pgSchema("nhp")` in
// schema.ts, so they don't need a search_path. Raw SQL written via
// `db.execute(sql\`...\`)` MUST qualify table names with `nhp.` (e.g.
// `FROM nhp.users`) — pooled/serverless Postgres endpoints (Neon HTTP,
// Supabase PgBouncer, etc.) reject the `options=-c search_path=...` startup
// parameter with `08P01 unsupported startup parameter in options: search_path`.
const SEARCH_PATH = "nhp,public";

function createDb() {
  if (env.DATABASE_PROVIDER === "local") {
    // Local Postgres allows the `options` startup parameter, so we set
    // search_path for developer convenience (raw SQL still uses `nhp.`).
    const pool = new pg.Pool({
      connectionString: env.DATABASE_URL,
      options: `-c search_path=${SEARCH_PATH}`,
    });
    return drizzleNode(pool, { schema, casing: "snake_case" });
  }

  // Neon HTTP (and any pooled endpoint): pass the URL through unchanged.
  const sql = neon(env.DATABASE_URL);
  return drizzleNeonHttp(sql, { schema, casing: "snake_case" });
}

export const db = createDb();
