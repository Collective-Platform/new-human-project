import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import pg from "pg";
import { env } from "@/src/env";
import * as schema from "./schema";

// PlanetScale Postgres exposes the Neon serverless wire protocol but at
// different HTTP/WS endpoints than neon.tech. Without these overrides the
// driver tries to hit Neon's endpoints and `fetch failed`s.
// https://planetscale.com/docs/postgres/connecting/neon-serverless-driver
neonConfig.fetchEndpoint = (host) => `https://${host}/sql`;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;
neonConfig.wsProxy = (host, port) => `${host}/v2?address=${host}:${port}`;

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
