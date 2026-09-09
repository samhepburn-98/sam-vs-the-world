import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import type { PGlite } from "@electric-sql/pglite"

// One bootstrap for every SQL suite: apply the migrations the way the database
// actually applies them — all of them, in order.
//
// Each suite used to hand-pick the handful it thought it needed, which quietly
// froze it at whatever the schema looked like that day. Tests then kept passing
// against definitions production had already replaced: `insert_rally_at` was
// still round-tripping the `ace` end reason seven weeks after a CHECK retired
// it, and against a signature the client had outgrown. A green suite asserting
// what production rejects is worse than no suite.
//
// PGlite has no Supabase-managed schemas, so the three migrations reaching into
// `auth` and `storage` can't run here. They were verified against the live
// project (§8) and are the only permitted exclusions — a suite that needs to
// skip more is a suite hiding drift.

const MIGRATIONS = join(__dirname, "../migrations")

const NEEDS_SUPABASE_SCHEMAS = ["rls_policies", "security_hardening", "avatars"]

/** every migration PGlite can run, oldest first */
export function migrationFiles(): Array<string> {
  return readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .filter((f) => !NEEDS_SUPABASE_SCHEMAS.some((skip) => f.includes(skip)))
}

/** a migration's SQL, minus the one line PGlite can't run */
export function migrationSql(file: string): string {
  // pgcrypto isn't needed (gen_random_uuid is core since PG13) and the
  // extension isn't bundled in PGlite — drop that single line.
  return readFileSync(join(MIGRATIONS, file), "utf8").replace(
    /^create extension if not exists pgcrypto;$/m,
    ""
  )
}

/** one named migration, for suites that stage a schema change mid-test */
export function loadMigration(nameFragment: string): string {
  const file = migrationFiles().find((f) => f.includes(nameFragment))
  if (!file) throw new Error(`migration matching "${nameFragment}" not found`)
  return migrationSql(file)
}

/**
 * Fresh database at the current schema. `stopBefore` applies everything up to
 * (but excluding) the named migration, for suites that need to write rows the
 * way they existed before a retirement, then apply it.
 */
export async function applyMigrations(
  db: PGlite,
  options: { stopBefore?: string } = {}
): Promise<void> {
  // the grant/revoke tails across the migrations need these to exist
  await db.exec(
    `create role anon; create role authenticated; create role service_role;`
  )
  for (const file of migrationFiles()) {
    if (options.stopBefore && file.includes(options.stopBefore)) return
    await db.exec(migrationSql(file))
  }
}

/** the rest of the migrations, after an `applyMigrations` stopped early */
export async function applyMigrationsFrom(
  db: PGlite,
  startAt: string
): Promise<void> {
  const files = migrationFiles()
  const from = files.findIndex((f) => f.includes(startAt))
  if (from === -1) throw new Error(`migration matching "${startAt}" not found`)
  for (const file of files.slice(from)) await db.exec(migrationSql(file))
}
