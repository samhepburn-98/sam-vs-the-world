import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { PGlite } from "@electric-sql/pglite"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

// Migration 0004c fixture tests (§8.7 #1): rally_lengths + momentum and their
// companions, pinning every acceptance criterion from #24 — bucket win rates
// with null/0 exclusion, a 12–10 overtime's late rallies in the close band,
// comeback firing AT the deficit threshold not below, and a streak that a
// let in the middle must not break.

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
let gameA: string // comeback at exactly deficit 4, Sam streak of 7
const DATE_A = "2026-06-01"
const DATE_B = "2026-06-02" // trailed by only 3, won
const DATE_C = "2026-06-03" // a let inside a Sam streak
const DATE_D = "2026-06-04" // 12–10 overtime
const DATE_E = "2026-06-05" // rally-length buckets

interface RallySpec {
  winner: string | null
  shotCount?: number | null
  server?: string
  reason?: string
}

async function seedMatch(date: string) {
  const res = await db.query<{ id: string }>(
    `insert into matches (player1_id, player2_id, date) values ($1, $2, $3) returning id`,
    [sam, dave, date],
  )
  return res.rows[0].id
}

async function seedGame(matchId: string, rallies: Array<RallySpec>) {
  const game = await db.query<{ id: string }>(
    `insert into games (match_id, game_number) values ($1, 1) returning id`,
    [matchId],
  )
  let n = 0
  for (const r of rallies) {
    n += 1
    await db.query(
      `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason, shot_count)
       values ($1, $2, $3, 'left', $4, $5, $6, $7)`,
      [
        game.rows[0].id,
        n,
        r.server ?? sam,
        r.reason === "serve_fault" ? 2 : 1,
        r.winner,
        r.reason ?? (r.winner === null ? "let" : "winner"),
        r.shotCount ?? null,
      ],
    )
  }
  return game.rows[0].id
}

/** n plain-winner rallies for one player, back to back. */
function wins(player: string, n: number): Array<RallySpec> {
  return Array.from({ length: n }, () => ({ winner: player }))
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(`create role anon; create role authenticated;`)
  await db.exec(loadMigration("enums_and_tables"))
  await db.exec(loadMigration("views"))
  await db.exec(loadMigration("house_rules"))
  await db.exec(loadMigration("insights_headline_h2h"))
  await db.exec(loadMigration("rally_lengths_momentum"))

  const players = await db.query<{ id: string }>(
    `insert into players (name) values ('Sam'), ('Dave') returning id`,
  )
  ;[sam, dave] = players.rows.map((r) => r.id)

  // A — Dave wins the first 4 (Sam trails 0–4, deficit exactly 4), then Sam
  //     wins 7 straight to take it 7–4. Comeback at 4; a Sam streak of 7.
  gameA = await seedGame(await seedMatch(DATE_A), [...wins(dave, 4), ...wins(sam, 7)])

  // B — Sam trails 0–3 then wins 4–3. Not a comeback at deficit 4; is one at 3.
  await seedGame(await seedMatch(DATE_B), [...wins(dave, 3), ...wins(sam, 4)])

  // C — Sam wins two, a let, then a third: the let must not break the run
  //     (three consecutive decided wins), and isn't itself a win.
  await seedGame(await seedMatch(DATE_C), [
    { winner: sam },
    { winner: sam },
    { winner: null }, // let — score holds, excluded from the streak
    { winner: sam },
    { winner: dave },
  ])

  // D — a 12–10 overtime: alternate to 10–10, then Sam wins the last two.
  //     Late rallies (leading score ≥ 9) must land in the close band.
  const overtime: Array<RallySpec> = []
  for (let i = 0; i < 10; i += 1) {
    overtime.push({ winner: sam }, { winner: dave })
  }
  overtime.push({ winner: sam }, { winner: sam }) // 11–10, 12–10
  await seedGame(await seedMatch(DATE_D), overtime)

  // E — rally-length buckets, with an untagged length and a double fault
  //     (0 shots) that must be excluded everywhere.
  await seedGame(await seedMatch(DATE_E), [
    { winner: sam, shotCount: 2 }, //  short, win
    { winner: dave, shotCount: 3 }, // short, loss
    { winner: sam, shotCount: 5 }, //  medium, win
    { winner: sam, shotCount: 8 }, //  medium, win
    { winner: dave, shotCount: 12 }, // long, loss
    { winner: sam, shotCount: 9 }, //  long, win
    { winner: sam, shotCount: null }, // untagged — excluded
    { winner: sam, shotCount: 0, server: dave, reason: "serve_fault" }, // double fault — excluded
  ])
})

afterAll(async () => {
  await db.close()
})

async function rallyLengths(dateFrom?: string, dateTo?: string) {
  const res = await db.query<Record<string, number>>(
    `select * from rally_lengths($1, p_date_from => $2, p_date_to => $3)`,
    [sam, dateFrom ?? null, dateTo ?? null],
  )
  expect(res.rows).toHaveLength(1)
  return res.rows[0]
}

async function momentum(opts: { from?: string; to?: string; deficit?: number } = {}) {
  const res = await db.query<
    Record<string, number | string | null> & {
      comeback_games: Array<Record<string, unknown>>
    }
  >(
    `select * from momentum($1, p_date_from => $2, p_date_to => $3, p_deficit => coalesce($4, 4))`,
    [sam, opts.from ?? null, opts.to ?? null, opts.deficit ?? null],
  )
  expect(res.rows).toHaveLength(1)
  return res.rows[0]
}

describe("rally_lengths", () => {
  it("buckets partition the average, with per-bucket win counts", async () => {
    const l = await rallyLengths(DATE_E, DATE_E)
    expect(l.total_rallies).toBe(6) // untagged + double fault both excluded
    expect(Number(l.avg_length)).toBeCloseTo(6.5, 2) // (2+3+5+8+12+9)/6
    expect(l.longest).toBe(12)
    expect(l).toMatchObject({
      short_rallies: 2,
      short_wins: 1,
      medium_rallies: 2,
      medium_wins: 2,
      long_rallies: 2,
      long_wins: 1,
    })
    // the three buckets sum to the average's denominator
    expect(l.short_rallies + l.medium_rallies + l.long_rallies).toBe(l.total_rallies)
  })

  it("companion returns exactly one bucket's rallies", async () => {
    const long = await db.query<{ shot_count: number }>(
      `select shot_count from rally_length_rallies($1, p_date_from => $2, p_date_to => $3, p_bucket => 'long')`,
      [sam, DATE_E, DATE_E],
    )
    expect(long.rows.map((r) => r.shot_count).sort((a, b) => a - b)).toEqual([9, 12])
    // null bucket = every counted rally (== total_rallies, 0-shot excluded)
    const all = await db.query<{ n: number }>(
      `select count(*)::int as n from rally_length_rallies($1, p_date_from => $2, p_date_to => $3)`,
      [sam, DATE_E, DATE_E],
    )
    expect(all.rows[0].n).toBe(6)
  })
})

describe("momentum — comebacks", () => {
  it("fires at exactly the deficit threshold, not below", async () => {
    // default deficit 4: only game A (trailed by 4) qualifies — game B
    // (trailed by 3) does not
    const def4 = await momentum()
    expect(def4.comebacks).toBe(1)
    expect(def4.comeback_games).toHaveLength(1)
    expect(def4.comeback_games[0]).toMatchObject({
      game_id: gameA,
      max_deficit: 4,
      player_score: 7,
      opponent_score: 4,
    })
    // lower the bar to 3 and game B joins
    const def3 = await momentum({ deficit: 3 })
    expect(def3.comebacks).toBe(2)
  })

  it("companion returns every rally of the comeback games", async () => {
    const def4 = await db.query<{ n: number }>(
      `select count(*)::int as n from comeback_rallies($1)`,
      [sam],
    )
    expect(def4.rows[0].n).toBe(11) // game A only
    const def3 = await db.query<{ n: number }>(
      `select count(*)::int as n from comeback_rallies($1, p_deficit => 3)`,
      [sam],
    )
    expect(def3.rows[0].n).toBe(11 + 7) // games A + B
  })
})

describe("momentum — streaks", () => {
  it("takes the longest within-game win run across the set", async () => {
    const m = await momentum()
    expect(m.longest_streak).toBe(7) // game A's 7 straight
    expect(m.longest_streak_game_id).toBe(gameA)
  })

  it("a let in the middle does not break a run", async () => {
    // game C: Sam wins, wins, LET, wins — three consecutive decided wins
    const m = await momentum({ from: DATE_C, to: DATE_C })
    expect(m.longest_streak).toBe(3)
  })
})

describe("momentum — phase bands", () => {
  it("lands a 12–10 overtime's late rallies in the close band", async () => {
    // target 11 → boundaries 4 and 8; leading ≥ 9 is close. Alternating to
    // 10–10 then +2 puts leadings 9,9,10,10,11,12 (six rallies) in close.
    const m = await momentum({ from: DATE_D, to: DATE_D })
    expect(m.close_rallies).toBe(6)
    expect(m.early_rallies).toBe(8) // leadings 1–4
    expect(m.mid_rallies).toBe(8) //   leadings 5–8
    expect(
      Number(m.early_rallies) + Number(m.mid_rallies) + Number(m.close_rallies),
    ).toBe(22)
  })
})

describe("API exposure", () => {
  it.each([
    "rally_lengths(uuid, uuid, ball_type, date, date)",
    "rally_length_rallies(uuid, uuid, ball_type, date, date, text)",
    "momentum(uuid, uuid, ball_type, date, date, integer)",
    "comeback_rallies(uuid, uuid, ball_type, date, date, integer)",
  ])("anon can execute %s", async (signature) => {
    const res = await db.query<{ ok: boolean }>(
      `select has_function_privilege('anon', 'public.${signature}', 'execute') as ok`,
    )
    expect(res.rows[0].ok).toBe(true)
  })
})
