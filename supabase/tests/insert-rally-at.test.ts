import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { PGlite } from "@electric-sql/pglite"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

// The mid-game insert (§5.4): insert_rally_at renumbers later rallies in one
// transaction via the DEFERRABLE unique constraint. Verified against a real
// game inserted through the actual migrations, PGlite-style (§8.7 #1).

const MIGRATIONS = join(__dirname, "../migrations")

// PGlite has no Supabase-managed schemas, so the three migrations that reach
// into `auth` and `storage` can't run here — they were verified against the
// live project (§8). Everything else loads in order, and that ordering is the
// point: this file used to hand-pick four migrations, so it ran against a
// July schema and happily round-tripped an `end_reason` the live CHECK now
// rejects, and exercised a signature the client had already outgrown.
const NEEDS_SUPABASE_SCHEMAS = ["rls_policies", "security_hardening", "avatars"]

function allMigrations(): Array<string> {
  return readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .filter((f) => !NEEDS_SUPABASE_SCHEMAS.some((skip) => f.includes(skip)))
    .map((f) =>
      readFileSync(join(MIGRATIONS, f), "utf8").replace(
        /^create extension if not exists pgcrypto;$/m,
        ""
      )
    )
}

let db: PGlite
let gameId: string
let p1: string
let p2: string

beforeAll(async () => {
  db = new PGlite()
  // the grant/revoke tails across the migrations need these to exist
  await db.exec(
    `create role anon; create role authenticated; create role service_role;`
  )
  for (const sql of allMigrations()) await db.exec(sql)

  const players = await db.query<{ id: string }>(
    `insert into players (name) values ('Sam'), ('Dave') returning id`
  )
  ;[p1, p2] = players.rows.map((r) => r.id)
  const match = await db.query<{ id: string }>(
    `insert into matches (player1_id, player2_id) values ($1, $2) returning id`,
    [p1, p2]
  )
  const game = await db.query<{ id: string }>(
    `insert into games (match_id, game_number) values ($1, 1) returning id`,
    [match.rows[0].id]
  )
  gameId = game.rows[0].id

  // a 3-rally fixture game: Sam, Dave, Sam — all plain winners
  for (const [n, winner] of [
    [1, p1],
    [2, p2],
    [3, p1],
  ] as const) {
    await db.query(
      `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason)
       values ($1, $2, $3, 'left', 1, $4, 'winner')`,
      [gameId, n, n === 1 ? p1 : winner, winner]
    )
  }
})

afterAll(async () => {
  await db.close()
})

describe("insert_rally_at", () => {
  it("inserts mid-game and renumbers the later rallies in one transaction", async () => {
    // the camera caught a missed let between rallies 1 and 2
    await db.query(
      `select insert_rally_at(gen_random_uuid(), $1, 2::smallint, $2, 'right', 1::smallint, null, 'let')`,
      [gameId, p1]
    )

    const rows = await db.query<{
      rally_number: number
      end_reason: string
      score_p1: number
      score_p2: number
    }>(
      `select rally_number, end_reason, score_p1, score_p2
       from rallies_scored where game_id = $1 order by rally_number`,
      [gameId]
    )

    expect(rows.rows.map((r) => [r.rally_number, r.end_reason])).toEqual([
      [1, "winner"],
      [2, "let"], // the insert
      [3, "winner"], // was 2
      [4, "winner"], // was 3
    ])
    // the let holds the score; the derivation self-heals downstream
    expect(rows.rows.map((r) => `${r.score_p1}-${r.score_p2}`)).toEqual([
      "1-0",
      "1-0",
      "1-1",
      "2-1",
    ])
  })

  it("appending at the end works (position = count + 1)", async () => {
    // an ace: a winner the server took on shot 1 (named notation — the
    // signature grew winning/losing shot columns since this was written)
    await db.query(
      `select insert_rally_at(
         p_id => gen_random_uuid(), p_game_id => $1, p_rally_number => 5::smallint,
         p_server_id => $2, p_serve_side => 'left', p_serve_number => 1::smallint,
         p_winner_id => $2, p_end_reason => 'winner', p_shot_count => 1::smallint
       )`,
      [gameId, p2]
    )
    const last = await db.query<{
      rally_number: number
      end_reason: string
      shot_count: number
    }>(
      `select rally_number, end_reason, shot_count from rallies
       where game_id = $1 order by rally_number desc limit 1`,
      [gameId]
    )
    expect(last.rows[0]).toEqual({
      rally_number: 5,
      end_reason: "winner",
      shot_count: 1,
    })
  })

  it("rejects the retired 'ace' end reason outright", async () => {
    await expect(
      db.query(
        `select insert_rally_at(
           p_id => gen_random_uuid(), p_game_id => $1, p_rally_number => 6::smallint,
           p_server_id => $2, p_serve_side => 'left', p_serve_number => 1::smallint,
           p_winner_id => $2, p_end_reason => 'ace'
         )`,
        [gameId, p2]
      )
    ).rejects.toThrow(/rallies_end_reason_current/)
  })

  it("constraint violations abort the whole thing — no half-applied renumber", async () => {
    // non-let with no winner violates rallies_let_null_winner
    await expect(
      db.query(
        `select insert_rally_at(gen_random_uuid(), $1, 2::smallint, $2, 'left', 1::smallint, null, 'winner')`,
        [gameId, p1]
      )
    ).rejects.toThrow(/rallies_let_null_winner/)

    // the failed call renumbered nothing
    const count = await db.query<{ n: number; max: number }>(
      `select count(*)::int as n, max(rally_number)::int as max
       from rallies where game_id = $1`,
      [gameId]
    )
    expect(count.rows[0]).toEqual({ n: 5, max: 5 })
  })
})
