import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import pg from "pg";
import { env } from "@/src/env";
import * as schema from "./schema";

// All NHP tables live in the `nhp` Postgres schema. We set the connection
// search_path so unqualified references in raw SQL (`FROM users`,
// `FROM friend_requests`, ...) resolve to nhp.* first, then public for
// built-ins (gen_random_uuid, etc.).
const SEARCH_PATH = "nhp,public";

function withSearchPath(connectionString: string): string {
  // postgres URL: append `options=-c search_path=nhp,public`
  const url = new URL(connectionString);
  const existing = url.searchParams.get("options") ?? "";
  const directive = `-c search_path=${SEARCH_PATH}`;
  if (!existing.includes("search_path")) {
    url.searchParams.set(
      "options",
      existing ? `${existing} ${directive}` : directive
    );
  }
  return url.toString();
}

function createDb() {
  if (env.DATABASE_PROVIDER === "local") {
    const pool = new pg.Pool({
      connectionString: env.DATABASE_URL,
      // pg understands `options` from connection string OR from this field
      options: `-c search_path=${SEARCH_PATH}`,
    });
    return drizzleNode(pool, { schema, casing: "snake_case" });
  }

  const sql = neon(withSearchPath(env.DATABASE_URL));
  return drizzleNeonHttp(sql, { schema, casing: "snake_case" });
}

export const db = createDb();
