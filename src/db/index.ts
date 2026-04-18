import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import pg from "pg";
import { env } from "@/src/env";
import * as schema from "./schema";
import * as sharedSchema from "./shared-schema";

const allSchemas = { ...sharedSchema, ...schema };

function createDb() {
  if (env.DATABASE_PROVIDER === "local") {
    const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
    return drizzleNode(pool, { schema: allSchemas, casing: "snake_case" });
  }

  const sql = neon(env.DATABASE_URL);
  return drizzleNeonHttp(sql, { schema: allSchemas, casing: "snake_case" });
}

export const db = createDb();
