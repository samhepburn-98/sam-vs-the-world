import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { PGlite } from "@electric-sql/pglite"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

// Starting a match writes two rows that must not half-land (§1.8): a game
// with no match is impossible, and a match with no game 1 is a dead session
// the user can't log into. Both inserts live in one function body, so they
// share the caller's transaction. Verified against the real migrations,
// PGlite-style (§8.7 #1).

const MIGRATIONS = join(__dirname, "../migrations")

function loadMigration(nameFragment: string) {
  const file = readdirSync(MIGRATIONS).find((f) => f.includes(nameFragment))
  if (!file) throw new Error(`migration matching "${nameFragment}" not found`)
  return readFileSync(join(MIGRATIONS, file), "utf8").replace(
    /^create extension if not exists pgcrypto;$/m,
    ""
  )
}

let db: PGlite
let p1: string
let p2: string

const countRows = async (table: "matches" | "games") => {
  const res = await db.query<{ n: number }>(
    `select count(*)::int as n from ${table}`
  )
  return res.rows[0].n
}

beforeAll(async () => {
  db = new PGlite()
  // the grant/revoke tail of the function migration needs these to exist
  await db.exec(`create role anon; create role authenticated;`)
  await db.exec(loadMigration("enums_and_tables"))
  await db.exec(loadMigration("house_rules"))
  await db.exec(loadMigration("create_match_with_game"))

  const players = await db.query<{ id: string }>(
    `insert into players (name) values ('Sam'), ('Dave') returning id`
  )
  ;[p1, p2] = players.rows.map((r) => r.id)
})

afterAll(async () => {
  await db.close()
})

describe("create_match_with_game", () => {
  it("writes the match and its game 1, returning the match id", async () => {
    const res = await db.query<{ create_match_with_game: string }>(
      `select create_match_with_game($1, $2, '2026-08-27'::date)`,
      [p1, p2]
    )
    const matchId = res.rows[0].create_match_with_game
    expect(matchId).toBeTruthy()

    const game = await db.query<{ match_id: string; game_number: number }>(
      `select match_id, game_number from games where match_id = $1`,
      [matchId]
    )
    expect(game.rows).toEqual([{ match_id: matchId, game_number: 1 }])
  })

  it("applies the house rules passed to it", async () => {
    const res = await db.query<{ create_match_with_game: string }>(
      `select create_match_with_game(
         $1, $2, '2026-08-27'::date, 'Local courts', 5::smallint, 15::smallint,
         'sudden_death'::tiebreak, 1::smallint, true, 'double_yellow'::ball_type
       )`,
      [p1, p2]
    )
    const row = await db.query(
      `select venue, format, target_score, tiebreak, serves_per_point,
              let_resets_serve, ball_type
       from matches where id = $1`,
      [res.rows[0].create_match_with_game]
    )
    expect(row.rows[0]).toEqual({
      venue: "Local courts",
      format: 5,
      target_score: 15,
      tiebreak: "sudden_death",
      serves_per_point: 1,
      let_resets_serve: true,
      ball_type: "double_yellow",
    })
  })

  it("defaults to a casual session with the standard rules", async () => {
    const res = await db.query<{ create_match_with_game: string }>(
      `select create_match_with_game($1, $2, '2026-08-27'::date)`,
      [p1, p2]
    )
    const row = await db.query(
      `select venue, format, target_score, tiebreak, serves_per_point,
              let_resets_serve, ball_type
       from matches where id = $1`,
      [res.rows[0].create_match_with_game]
    )
    expect(row.rows[0]).toEqual({
      venue: null,
      format: null,
      target_score: 11,
      tiebreak: "win_by_2",
      serves_per_point: 2,
      let_resets_serve: false,
      ball_type: null,
    })
  })

  it("rolls the match back when the game insert fails — no orphan match", async () => {
    const matchesBefore = await countRows("matches")
    // the only way to fail the second insert on a brand-new match
    await db.exec(`
      create function fail_game_insert() returns trigger
        language plpgsql as $$ begin raise exception 'game insert blew up'; end; $$;
      create trigger t_fail_game before insert on games
        for each row execute function fail_game_insert();
    `)

    await expect(
      db.query(`select create_match_with_game($1, $2, '2026-08-27'::date)`, [
        p1,
        p2,
      ])
    ).rejects.toThrow(/game insert blew up/)

    await db.exec(`
      drop trigger t_fail_game on games;
      drop function fail_game_insert();
    `)

    // the match row went with it: the pair is all-or-nothing
    expect(await countRows("matches")).toBe(matchesBefore)
  })

  it("a rejected match writes nothing at all", async () => {
    const before = {
      matches: await countRows("matches"),
      games: await countRows("games"),
    }

    await expect(
      db.query(`select create_match_with_game($1, $1, '2026-08-27'::date)`, [
        p1,
      ])
    ).rejects.toThrow(/matches_distinct_players/)

    expect(await countRows("matches")).toBe(before.matches)
    expect(await countRows("games")).toBe(before.games)
  })
})

describe("API exposure", () => {
  const SIGNATURE =
    "create_match_with_game(uuid, uuid, date, text, smallint, smallint, tiebreak, smallint, boolean, ball_type)"

  it.each([
    ["anon", false],
    ["authenticated", true],
  ])("%s execute = %s — owner writes only", async (role, allowed) => {
    const res = await db.query<{ ok: boolean }>(
      `select has_function_privilege($1, 'public.${SIGNATURE}', 'execute') as ok`,
      [role]
    )
    expect(res.rows[0].ok).toBe(allowed)
  })
})
