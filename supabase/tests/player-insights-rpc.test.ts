import { PGlite } from "@electric-sql/pglite"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { applyMigrations } from "./migrations"

// player_insights (§3 efficiency item 1) and the drill-through p_limit (item
// 7), against the whole migration set — so what is asserted here is what
// production ships.
//
// The property that matters for player_insights is not what it computes but
// that it computes nothing of its own: every payload must be byte-identical
// to calling the underlying function directly, because the moment it isn't,
// the profile and its drill-through tables can disagree about the same rally
// set. Each case below asserts that equality rather than a literal number.

let db: PGlite
let sam: string
let alex: string

beforeAll(async () => {
  db = new PGlite()
  await applyMigrations(db)

  const players = await db.query<{ id: string }>(
    `insert into players (name) values ('Sam'), ('Alex') returning id`
  )
  ;[sam, alex] = players.rows.map((r) => r.id)

  const match = await db.query<{ id: string }>(
    `insert into matches (player1_id, player2_id, date, ball_type)
     values ($1, $2, '2026-07-04', 'blue') returning id`,
    [sam, alex]
  )
  const game = await db.query<{ id: string }>(
    `insert into games (match_id, game_number) values ($1, 1) returning id`,
    [match.rows[0].id]
  )
  // 12 rallies, all served by Sam: 7 his (a mix of winners and Alex errors),
  // 5 Alex's. Enough for every payload to be non-trivial and for a limit to
  // have something to cut.
  const rallies = [
    ...Array.from({ length: 4 }, () => ({ w: sam, r: "winner", s: 5 })),
    ...Array.from({ length: 3 }, () => ({ w: sam, r: "error", s: 3 })),
    ...Array.from({ length: 5 }, () => ({ w: alex, r: "error", s: 4 })),
  ]
  const params: Array<unknown> = [game.rows[0].id, sam]
  const values = rallies.map((x, i) => {
    const at = params.length
    params.push(x.w, x.r, x.s)
    return `($1, ${i + 1}, $2, 'left', 1, $${at + 1}::uuid, $${at + 2}::public.end_reason, $${at + 3}::smallint)`
  })
  await db.query(
    `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason, shot_count)
     values ${values.join(", ")}`,
    params
  )
})

afterAll(async () => db.close())

async function one<T>(sql: string, params: Array<unknown> = []): Promise<T> {
  const res = await db.query<T>(sql, params)
  return res.rows[0]
}

describe("player_insights", () => {
  it("returns exactly one row", async () => {
    const res = await db.query(`select * from player_insights($1)`, [sam])
    expect(res.rows).toHaveLength(1)
  })

  it("returns one row even for a player who has never played", async () => {
    const res = await db.query(
      `select * from player_insights('00000000-0000-0000-0000-000000000000')`
    )
    expect(res.rows).toHaveLength(1)
  })

  // the whole point: this function must never compute anything of its own
  it.each([
    ["headline", "player_headline"],
    ["serve", "serve_stats"],
    ["errors", "error_profile"],
    ["rally_lengths", "rally_lengths"],
    ["momentum", "momentum"],
    ["decisive_shots", "decisive_shots"],
  ])("its %s payload equals %s() called directly", async (column, fn) => {
    const row = await one<{ same: boolean }>(
      `select (select ${column} from player_insights($1))
            = (select to_jsonb(x) from ${fn}($1) x) as same`,
      [sam]
    )
    expect(row.same).toBe(true)
  })

  it("passes its filters through — an opponent filter that matches nobody empties the payloads", async () => {
    const row = await one<{ played: number }>(
      `select (rally_lengths ->> 'total_rallies')::int as played
       from player_insights($1, '00000000-0000-0000-0000-000000000000')`,
      [sam]
    )
    expect(row.played).toBe(0)
  })

  it("passes the opponent filter through as the real opponent", async () => {
    const row = await one<{ same: boolean }>(
      `select (select rally_lengths from player_insights($1, $2))
            = (select to_jsonb(x) from rally_lengths($1, $2) x) as same`,
      [sam, alex]
    )
    expect(row.same).toBe(true)
  })
})

describe("drill-through p_limit", () => {
  it("returns everything when the limit is omitted", async () => {
    const res = await db.query(`select * from serve_rallies($1)`, [sam])
    expect(res.rows.length).toBe(12)
  })

  it("caps the rows when a limit is given", async () => {
    const res = await db.query(
      `select * from serve_rallies($1, null, null, null, null, 5)`,
      [sam]
    )
    expect(res.rows).toHaveLength(5)
  })

  // The point of the cap: a drill-through shows the rallies behind the stat
  // as it stands, so it must take the most RECENT n. Taking the first n would
  // have pinned the table to the earliest points ever logged, where it would
  // have stayed however many more were played.
  it("takes the most recent n, not the first n", async () => {
    const all = await db.query<{ rally_number: number }>(
      `select rally_number from serve_rallies($1)`,
      [sam]
    )
    const capped = await db.query<{ rally_number: number }>(
      `select rally_number from serve_rallies($1, null, null, null, null, 4)`,
      [sam]
    )
    expect(capped.rows.map((r) => r.rally_number)).toEqual(
      all.rows.slice(-4).map((r) => r.rally_number)
    )
  })

  it("still hands them back oldest-first", async () => {
    const capped = await db.query<{ rally_number: number }>(
      `select rally_number from serve_rallies($1, null, null, null, null, 4)`,
      [sam]
    )
    const numbers = capped.rows.map((r) => r.rally_number)
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b))
  })

  it("applies to error_rallies and rally_length_rallies too", async () => {
    const errors = await db.query(
      `select * from error_rallies($1, null, null, null, null, 2)`,
      [sam]
    )
    expect(errors.rows.length).toBeLessThanOrEqual(2)
    const lengths = await db.query(
      `select * from rally_length_rallies($1, null, null, null, null, null, 3)`,
      [sam]
    )
    expect(lengths.rows).toHaveLength(3)
  })

  it("leaves every payload unchanged when the limit is null", async () => {
    for (const call of [
      `serve_rallies($1)`,
      `error_rallies($1)`,
      `rally_length_rallies($1)`,
      `comeback_rallies($1)`,
    ]) {
      const explicit = await db.query(
        `select * from ${call.replace("($1)", "($1, null, null, null, null)")}`,
        [sam]
      )
      const implicit = await db.query(`select * from ${call}`, [sam])
      expect(implicit.rows).toEqual(explicit.rows)
    }
  })
})

describe("API exposure", () => {
  // the insight RPCs are public-read, same reach as the views they read from
  it("anon can execute player_insights", async () => {
    const res = await db.query<{ ok: boolean }>(
      `select has_function_privilege('anon',
         'public.player_insights(uuid, uuid, ball_type, date, date)', 'execute') as ok`
    )
    expect(res.rows[0].ok).toBe(true)
  })
})

// comeback_rallies caps by GAME, so it gets its own database: the shared
// fixture above has no game anyone came back to win, and a cap test against a
// fixture with nothing to cap passes without proving anything.
describe("comeback_rallies caps by game", () => {
  let cdb: PGlite
  let player: string

  beforeAll(async () => {
    cdb = new PGlite()
    await applyMigrations(cdb)

    const players = await cdb.query<{ id: string }>(
      `insert into players (name) values ('Comeback Kid'), ('Rival') returning id`
    )
    const [me, them] = players.rows.map((r) => r.id)
    player = me

    // two games, a fortnight apart, each one lost 0-4 and then won 11-4
    for (const date of ["2026-07-01", "2026-07-15"]) {
      const match = await cdb.query<{ id: string }>(
        `insert into matches (player1_id, player2_id, date, ball_type)
         values ($1, $2, $3, 'blue') returning id`,
        [me, them, date]
      )
      const game = await cdb.query<{ id: string }>(
        `insert into games (match_id, game_number) values ($1, 1) returning id`,
        [match.rows[0].id]
      )
      const winners = [
        ...Array.from({ length: 4 }, () => them),
        ...Array.from({ length: 11 }, () => me),
      ]
      const params: Array<unknown> = [game.rows[0].id, me]
      const values = winners.map((w, i) => {
        const at = params.length
        params.push(w)
        return `($1, ${i + 1}, $2, 'left', 1, $${at + 1}::uuid, 'winner', 5)`
      })
      await cdb.query(
        `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason, shot_count)
         values ${values.join(", ")}`,
        params
      )
    }
  })

  afterAll(async () => cdb.close())

  const gamesIn = (rows: Array<{ game_id: string | null }>) => [
    ...new Set(rows.map((r) => r.game_id)),
  ]

  it("finds both comebacks when uncapped", async () => {
    const res = await cdb.query<{ game_id: string }>(
      `select game_id from comeback_rallies($1)`,
      [player]
    )
    expect(gamesIn(res.rows)).toHaveLength(2)
    expect(res.rows).toHaveLength(30)
  })

  it("a limit of 1 keeps one game, not one rally", async () => {
    const res = await cdb.query<{ game_id: string }>(
      `select game_id from comeback_rallies($1, null, null, null, null, 4, 1)`,
      [player]
    )
    expect(gamesIn(res.rows)).toHaveLength(1)
    // the whole game came back, all fifteen rallies of it
    expect(res.rows).toHaveLength(15)
  })

  it("keeps the most recent game, not the first", async () => {
    // formatted in SQL: the driver hands dates back as local-zone Date
    // objects, so asserting on the JS side would pass or fail by timezone
    const res = await cdb.query<{ day: string }>(
      `select distinct to_char(date, 'YYYY-MM-DD') as day
       from comeback_rallies($1, null, null, null, null, 4, 1)`,
      [player]
    )
    expect(res.rows).toHaveLength(1)
    expect(res.rows[0].day).toBe("2026-07-15")
  })
})
