import { PGlite } from "@electric-sql/pglite"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { applyMigrations } from "./migrations"

// Starting a match writes two rows that must not half-land (§1.8): a game
// with no match is impossible, and a match with no game 1 is a dead session
// the user can't log into. Both inserts live in one function body, so they
// share the caller's transaction. Verified against the real migrations,
// PGlite-style (§8.7 #1).

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
  await applyMigrations(db)

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

// §1.8's promise isn't "two rows landed" — it's that the pair is a session the
// user can log into. That only means anything against the rally model as it
// stands today, and this suite used to load three hand-picked migrations, so
// it couldn't see the model at all. Everything below post-dates those three:
// the ace retirement and its derived replacement (20260710160000, §3.3.2),
// and the rallies_scored the shot split rebuilt (20260710200000). If the
// loading ever narrows again, these fail rather than quietly agreeing with a
// July schema — under the old three, an 'ace' row inserted happily.
describe("the game it opens is loggable at the current model", () => {
  let gameId: string

  beforeAll(async () => {
    const created = await db.query<{ create_match_with_game: string }>(
      `select create_match_with_game($1, $2, '2026-08-27'::date)`,
      [p1, p2]
    )
    const game = await db.query<{ id: string }>(
      `select id from games where match_id = $1 and game_number = 1`,
      [created.rows[0].create_match_with_game]
    )
    gameId = game.rows[0].id

    // Three rallies straight into the fresh game, written the way the logger
    // writes them: Sam's serve won on one shot (an ace, by derivation), a
    // rally Dave takes off the return, then one Dave serves and wins long.
    // The lengths are deliberate — a server's winner on shot_count 1 IS an
    // ace, and the logger's fresh draft opens on 1, so a plain winner has to
    // carry a real rally length or it lands in the ace count.
    for (const [n, server, winner, shots] of [
      [1, p1, p1, 1],
      [2, p1, p2, 9],
      [3, p2, p2, 5],
    ] as const) {
      await db.query(
        `insert into rallies (game_id, rally_number, server_id, serve_side,
                              serve_number, winner_id, end_reason, shot_count)
         values ($1, $2, $3, 'left', 1, $4, 'winner', $5)`,
        [gameId, n, server, winner, shots]
      )
    }
  })

  it("takes rallies the moment it exists, and scores them", async () => {
    const rows = await db.query<{ score_p1: number; score_p2: number }>(
      `select score_p1, score_p2 from rallies_scored
       where game_id = $1 order by rally_number`,
      [gameId]
    )
    // the game the function opened is wired to its match: rallies_scored can
    // only name the two players by walking games → matches
    expect(rows.rows.map((r) => `${r.score_p1}-${r.score_p2}`)).toEqual([
      "1-0",
      "1-1",
      "1-2",
    ])
  })

  it("rejects the retired 'ace' end reason", async () => {
    await expect(
      db.query(
        `insert into rallies (game_id, rally_number, server_id, serve_side,
                              serve_number, winner_id, end_reason)
         values ($1, 4, $2, 'left', 1, $2, 'ace')`,
        [gameId, p1]
      )
    ).rejects.toThrow(/rallies_end_reason_current/)
  })

  it("counts rally 1 as an ace anyway — derived from the row's shape", async () => {
    const stats = await db.query<{
      aces: number
      rallies_served: number
      serve_wins: number
    }>(`select aces, rallies_served, serve_wins from serve_stats($1, $2)`, [
      p1,
      p2,
    ])
    // the coverage the stored end reason used to carry, kept where it lives
    // now: winner + shot_count 1 + winner is the server (§3.3.2)
    expect(stats.rows[0]).toEqual({ aces: 1, rallies_served: 2, serve_wins: 1 })

    const stored = await db.query<{ n: number }>(
      `select count(*)::int as n from rallies where end_reason = 'ace'`
    )
    expect(stored.rows[0].n).toBe(0)
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
