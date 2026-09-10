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

  it("keeps the same ordering, so a limit takes the first n", async () => {
    const all = await db.query<{ rally_number: number }>(
      `select rally_number from serve_rallies($1)`,
      [sam]
    )
    const capped = await db.query<{ rally_number: number }>(
      `select rally_number from serve_rallies($1, null, null, null, null, 4)`,
      [sam]
    )
    expect(capped.rows.map((r) => r.rally_number)).toEqual(
      all.rows.slice(0, 4).map((r) => r.rally_number)
    )
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
