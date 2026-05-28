import "server-only";
import postgres from "postgres";

/**
 * Single, shared Postgres client. Connection-pooled internally by the
 * `postgres` driver. Re-used across hot-reloads in dev via globalThis.
 *
 * Env: DATABASE_URI — e.g. `postgresql:///unfiltered_dev?host=/var/run/postgresql`.
 *
 * Usage:
 *   import { sql } from "@/lib/db";
 *   const rows = await sql`SELECT * FROM uf_colleges WHERE slug = ${slug}`;
 *   // typed:
 *   const rows = await sql<CollegeRow[]>`SELECT id, slug, name FROM uf_colleges`;
 *
 * Template-literal interpolation is parameterized (no SQL injection). Use
 * sql() to interpolate raw identifiers when needed: sql`... ORDER BY ${sql(col)}`.
 */
const url = process.env.DATABASE_URI;
if (!url) {
  throw new Error("DATABASE_URI must be set");
}

declare global {
  // eslint-disable-next-line no-var
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

/**
 * The porsager/postgres URL parser doesn't honor libpq's `?host=` query
 * param for unix-socket connections — it ignores it and falls back to TCP
 * localhost. We detect that form and convert it to the driver's options.
 */
function clientFromUri(uri: string): ReturnType<typeof postgres> {
  const u = new URL(uri);
  const socketHost = u.searchParams.get("host");
  if (socketHost) {
    return postgres({
      host: socketHost,
      database: u.pathname.slice(1) || undefined,
      username: u.username || process.env.USER,
      password: u.password || undefined,
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return postgres(uri, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

export const sql = globalThis.__pgClient ?? clientFromUri(url);

if (process.env.NODE_ENV !== "production") {
  globalThis.__pgClient = sql;
}
