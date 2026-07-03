import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { PGlite } from "@electric-sql/pglite"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

// Migration 0004b fixture tests (§8.7 #1): serve_stats + error_profile and
// their companions, including the traps from #23 — a let landing between a
// first-serve fault and its serve-2 replay (the point must count once), a
// single-serve match contributing to serve win % but not serve-number stats,
// and the forced/unforced/untagged three-way.

const MIGRATIONS = join(__dirname, "../migrations")

function loadMigration(nameFragment: string) {
  const file = readdirSync(MIGRATIONS).find((f) => f.includes(nameFragment))
  if (!file) throw new Error(`migration matching "${nameFragment}" not found`)
  return readFileSync(join(MIGRATIONS, file), "utf8").replace(
    /^create extension if not exists pgcrypto;$/m,
    "",
  )
}

let db: PGlite
let sam: string
let dave: string
let matchTwoServe: string
let matchSingleServe: string

interface RallySpec {
  server: string
  winner: string | null
  side?: "left" | "right"
  serveNo?: 1 | 2
  reason?: string
  detail?: string | null
  forced?: boolean | null
}

async function seedGame(matchId: string, gameNumber: number, rallies: Array<RallySpec>) {
  const game = await db.query<{ id: string }>(
    `insert into games (match_id, game_number) values ($1, $2) returning id`,
    [matchId, gameNumber],
  )
  let n = 0
  for (const r of rallies) {
    n += 1
    await db.query(
      `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason, error_detail, forced)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        game.rows[0].id,
        n,
        r.server,
        r.side ?? "left",
        r.serveNo ?? 1,
        r.winner,
        r.reason ?? (r.winner === null ? "let" : "winner"),
        r.detail ?? null,
        r.forced ?? null,
      ],
    )
  }
  return game.rows[0].id
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(`create role anon; create role authenticated;`)
  await db.exec(loadMigration("enums_and_tables"))
  await db.exec(loadMigration("views"))
  await db.exec(loadMigration("house_rules"))
  await db.exec(loadMigration("insights_headline_h2h"))
  await db.exec(loadMigration("serve_stats_error_profile"))

  const players = await db.query<{ id: string }>(
    `insert into players (name) values ('Sam'), ('Dave') returning id`,
  )
  ;[sam, dave] = players.rows.map((r) => r.id)

  // Match 1 — two serves per point (the default), blue ball.
  const m1 = await db.query<{ id: string }>(
    `insert into matches (player1_id, player2_id, date, ball_type) values ($1, $2, '2026-06-01', 'blue') returning id`,
    [sam, dave],
  )
  matchTwoServe = m1.rows[0].id
  await seedGame(matchTwoServe, 1, [
    // 1: Sam serves left, first serve, clean winner
    { server: sam, side: "left", serveNo: 1, winner: sam },
    // 2: Sam's first serve faulted (implicit) → point played on serve 2,
    //    Sam tins it — an unforced error on the right box
    { server: sam, side: "right", serveNo: 2, winner: dave, reason: "error", detail: "tin", forced: false },
    // 3+4: THE TRAP — first serve faults, then a LET interrupts the serve-2
    //      point; the replay (still serve 2) is the only decided row. The
    //      pair must count as ONE served rally and ONE first-serve fault.
    { server: sam, side: "right", serveNo: 2, winner: null },
    { server: sam, side: "right", serveNo: 2, winner: sam },
    // 5: Dave aces Sam
    { server: dave, side: "left", serveNo: 1, winner: dave, reason: "ace" },
    // 6: Dave double-faults (second-serve fault → receiver wins, by CHECK)
    { server: dave, side: "left", serveNo: 2, winner: sam, reason: "serve_fault" },
    // 7: Sam's forced error (out over the front-wall line)
    { server: sam, side: "left", serveNo: 1, winner: dave, reason: "error", detail: "out_top", forced: true },
    // 8: Sam errs again, nothing tagged — forced NULL, detail NULL
    { server: sam, side: "left", serveNo: 1, winner: dave, reason: "error" },
  ])

  // Match 2 — SINGLE-serve squash (§7.7), yellow ball: counts toward serve
  // win % but must stay out of every serve-number stat.
  const m2 = await db.query<{ id: string }>(
    `insert into matches (player1_id, player2_id, date, ball_type, serves_per_point) values ($1, $2, '2026-06-10', 'yellow', 1) returning id`,
    [sam, dave],
  )
  matchSingleServe = m2.rows[0].id
  await seedGame(matchSingleServe, 1, [
    { server: sam, winner: sam },
    { server: sam, winner: sam },
    { server: sam, winner: dave, reason: "error", detail: "not_up", forced: false },
  ])
})

afterAll(async () => {
  await db.close()
})

async function serveStats(playerId: string, filters = "") {
  const res = await db.query<Record<string, number>>(
    `select * from serve_stats($1${filters})`,
    [playerId],
  )
  expect(res.rows).toHaveLength(1)
  return res.rows[0]
}

async function errorProfile(playerId: string) {
  const res = await db.query<
    Record<string, number> & { trend: Array<Record<string, unknown>> }
  >(`select * from error_profile($1)`, [playerId])
  expect(res.rows).toHaveLength(1)
  return res.rows[0]
}

describe("serve_stats", () => {
  it("excludes lets from every denominator — the fault-let-replay pair counts once", async () => {
    const s = await serveStats(sam)
    // Sam served 5 decided rallies in match 1 (the let is not one) + 3 in
    // match 2. Rows 2 and 4 played on serve 2 → two first-serve faults.
    expect(s.rallies_served).toBe(8)
    expect(s.serve_wins).toBe(4) // rows 1, 4 + two single-serve wins
    expect(s.first_serve_faults).toBe(2)
  })

  it("computes serve-number stats over two-serve matches only", async () => {
    const s = await serveStats(sam)
    expect(s.two_serve_rallies_served).toBe(5) // match 1 only — not 8
    expect(s.serve1_served).toBe(3)
    expect(s.serve1_wins).toBe(1)
    expect(s.serve2_served).toBe(2)
    expect(s.serve2_wins).toBe(1) // the post-let replay
  })

  it("counts return points, aces and double faults", async () => {
    const s = await serveStats(sam)
    expect(s.rallies_returned).toBe(2) // Dave's two decided serves
    expect(s.return_wins).toBe(1) // Dave's double fault
    expect(s.aces).toBe(0)
    expect(s.double_faults).toBe(0)

    const d = await serveStats(dave)
    expect(d).toMatchObject({
      rallies_served: 2,
      serve_wins: 1,
      aces: 1,
      double_faults: 1,
      rallies_returned: 8,
      return_wins: 4, // rows 2, 7, 8 + the single-serve error
      first_serve_faults: 1, // the double fault was a point on serve 2
    })
  })

  it("splits win rate by serve side", async () => {
    const s = await serveStats(sam)
    expect(s.left_served).toBe(6) // rows 1, 7, 8 + all three single-serve
    expect(s.left_wins).toBe(3) // row 1 + two single-serve wins
    expect(s.right_served).toBe(2) // rows 2, 4
    expect(s.right_wins).toBe(1) // the replay
  })

  it("applies the cross-cutting filters", async () => {
    const yellow = await db.query<{ rallies_served: number; two_serve_rallies_served: number }>(
      `select rallies_served, two_serve_rallies_served from serve_stats($1, p_ball_type => 'yellow')`,
      [sam],
    )
    expect(yellow.rows[0]).toMatchObject({
      rallies_served: 3,
      two_serve_rallies_served: 0,
    })
    const dated = await db.query<{ rallies_served: number }>(
      `select rallies_served from serve_stats($1, p_date_to => '2026-06-05')`,
      [sam],
    )
    expect(dated.rows[0].rallies_served).toBe(5)
  })

  it("serve_rallies returns exactly the rows the aggregate counted", async () => {
    const rows = await db.query<{ is_let: boolean; server_id: string }>(
      `select is_let, server_id from serve_rallies($1)`,
      [sam],
    )
    expect(rows.rows).toHaveLength(8) // == rallies_served
    expect(rows.rows.every((r) => !r.is_let && r.server_id === sam)).toBe(true)
  })
})

describe("error_profile", () => {
  it("attributes errors to the non-winner across error and serve_fault", async () => {
    const e = await errorProfile(sam)
    expect(e.errors_total).toBe(4) // rows 2, 7, 8 + the single-serve not_up
    expect(e.games_played).toBe(2)

    const d = await errorProfile(dave)
    expect(d.errors_total).toBe(1) // only the double fault
  })

  it("keeps the forced three-way honest — untagged is never folded in", async () => {
    const e = await errorProfile(sam)
    expect(e.forced_errors).toBe(1)
    expect(e.unforced_errors).toBe(2)
    expect(e.untagged_errors).toBe(1) // row 8: forced NULL stays untagged
    // the three-way spans 'error' rows only — Dave's serve_fault (which can
    // never carry a forced tag) lands in none of them
    const d = await errorProfile(dave)
    expect(d.forced_errors + d.unforced_errors + d.untagged_errors).toBe(0)
    expect(d.detail_untagged).toBe(1)
  })

  it("splits by error detail, with untagged counted separately", async () => {
    const e = await errorProfile(sam)
    expect(e).toMatchObject({
      tin: 1,
      out_top: 1,
      not_up: 1,
      out_side: 0,
      out_back: 0,
      double_bounce: 0,
      detail_untagged: 1,
    })
  })

  it("returns a date-ascending per-match trend", async () => {
    const e = await errorProfile(sam)
    expect(e.trend).toEqual([
      { match_id: matchTwoServe, date: "2026-06-01", errors: 3, games: 1 },
      { match_id: matchSingleServe, date: "2026-06-10", errors: 1, games: 1 },
    ])
  })

  it("error_rallies returns exactly the rows the aggregate counted", async () => {
    const rows = await db.query<{ end_reason: string; winner_id: string }>(
      `select end_reason, winner_id from error_rallies($1)`,
      [sam],
    )
    expect(rows.rows).toHaveLength(4) // == errors_total
    expect(rows.rows.every((r) => r.winner_id !== sam)).toBe(true)
  })
})

describe("API exposure", () => {
  it.each([
    "serve_stats(uuid, uuid, ball_type, date, date)",
    "serve_rallies(uuid, uuid, ball_type, date, date)",
    "error_profile(uuid, uuid, ball_type, date, date)",
    "error_rallies(uuid, uuid, ball_type, date, date)",
  ])("anon can execute %s", async (signature) => {
    const res = await db.query<{ ok: boolean }>(
      `select has_function_privilege('anon', 'public.${signature}', 'execute') as ok`,
    )
    expect(res.rows[0].ok).toBe(true)
  })
})
