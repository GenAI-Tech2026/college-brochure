/**
 * Lightweight migration runner.
 *
 * Reads every .sql file in scripts/migrations/ in lexicographic order,
 * checks uf_migrations for already-applied rows, and applies the rest in
 * a single transaction per file.
 *
 * Idempotent. Safe to re-run.
 *
 * Usage: `npm run migrate`
 */
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "migrations");

const url = process.env.DATABASE_URI;
if (!url) {
  console.error("DATABASE_URI must be set");
  process.exit(1);
}

function client(uri: string) {
  const u = new URL(uri);
  const socketHost = u.searchParams.get("host");
  if (socketHost) {
    return postgres({
      host: socketHost,
      database: u.pathname.slice(1) || undefined,
      username: u.username || process.env.USER,
      max: 1,
      onnotice: () => {},
    });
  }
  return postgres(uri, { max: 1, onnotice: () => {} });
}

const sql = client(url);

async function main() {
  // Bootstrap the bookkeeping table without depending on the migration
  // it's defined in — so the very first run can still record itself.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS uf_migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const applied = new Set(
    (await sql<{ name: string }[]>`SELECT name FROM uf_migrations`).map(
      (r) => r.name,
    ),
  );

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[migrate] skip · ${file}`);
      continue;
    }
    const body = await readFile(join(dir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`INSERT INTO uf_migrations (name) VALUES (${file})`;
    });
    console.log(`[migrate] apply · ${file}`);
  }

  console.log("[migrate] done");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
