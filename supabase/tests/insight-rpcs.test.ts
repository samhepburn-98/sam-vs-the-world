import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { PGlite } from "@electric-sql/pglite"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

// Migration 0004a fixture tests (§8.7 #1): player_headline(s) + h2h and the
// shared filter helpers, asserted row-by-row against seeded games covering
// lets, an undecided game, every filter param, and the §3.2 signature-trait
// thresholds (≥30 rallies per bucket, 10-point gap) at their boundaries.

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

async function seedPlayers(...names: Array<string>) {
  const out: Array<string> = []
  for (const name of names) {
    const res = await db.query<{ id: string }>(
      `insert into players (name) values ($1) returning id`,
      [name]
    )
    out.push(res.rows[0].id)
  }
  return out
}

async function seedMatch(
  p1: string,
  p2: string,
  date: string,
  ball: string | null = null
) {
  const res = await db.query<{ id: string }>(
    `insert into matches (player1_id, player2_id, date, ball_type) values ($1, $2, $3, $4) returning id`,
    [p1, p2, date, ball]
  )
  return res.rows[0].id
}

async function seedGame(matchId: string, gameNumber: number) {
  const res = await db.query<{ id: string }>(
    `insert into games (match_id, game_number) values ($1, $2) returning id`,
    [matchId, gameNumber]
  )
  return res.rows[0].id
}

/** winner null = let; shotCount null = untagged rally length. */
async function seedRallies(
  gameId: string,
  server: string,
  rallies: Array<{ winner: string | null; shotCount?: number | null }>
) {
  let n = 0
  for (const r of rallies) {
    n += 1
    await db.query(
      `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason, shot_count)
       values ($1, $2, $3, 'left', 1, $4, $5, $6)`,
      [
        gameId,
        n,
        server,
        r.winner,
        r.winner === null ? "let" : "winner",
        r.shotCount ?? null,
      ]
    )
  }
}

/** n rallies in the bucket's shot count, `wins` of them won by `player`. */
function bucket(
  player: string,
  other: string,
  n: number,
  wins: number,
  shotCount: number
) {
  return Array.from({ length: n }, (_, i) => ({
    winner: i < wins ? player : other,
    shotCount,
  }))
}

let sam: string
let dave: string
let alex: string
let matchA: string
let matchB: string

beforeAll(async () => {
  db = new PGlite()
  await db.exec(`create role anon; create role authenticated;`)
  await db.exec(loadMigration("enums_and_tables"))
  await db.exec(loadMigration("views"))
  await db.exec(loadMigration("house_rules"))
  await db.exec(loadMigration("insights_headline_h2h"))
  ;[sam, dave, alex] = await seedPlayers("Sam", "Dave", "Alex")

  // Match A — Sam vs Dave, blue ball, 2026-06-01. Drawn 1–1 with a third
  // game left undecided (tied at its last rally).
  matchA = await seedMatch(sam, dave, "2026-06-01", "blue")
  await seedRallies(await seedGame(matchA, 1), sam, [
    { winner: sam },
    { winner: null }, // a let mid-game: no score change, still a row
    { winner: sam },
    { winner: dave },
    { winner: sam }, // Sam 3–1
  ])
  await seedRallies(await seedGame(matchA, 2), dave, [
    { winner: dave },
    { winner: dave }, // Dave 2–0
  ])
  await seedRallies(await seedGame(matchA, 3), sam, [
    { winner: sam },
    { winner: dave }, // 1–1 — undecided
  ])

  // Match B — Sam vs Alex, double yellow, 2026-06-15. Sam 2–0.
  matchB = await seedMatch(sam, alex, "2026-06-15", "double_yellow")
  await seedRallies(await seedGame(matchB, 1), sam, [
    { winner: sam },
    { winner: sam }, // Sam 2–0
  ])
  await seedRallies(await seedGame(matchB, 2), alex, [
    { winner: alex },
    { winner: sam },
    { winner: sam }, // Sam 2–1
  ])
})

afterAll(async () => {
  await db.close()
})

async function headline(playerId: string, filters = "") {
  const res = await db.query<{
    player_id: string
    games_won: number
    games_decided: number
    matches_won: number
    matches_decided: number
    signature_trait: string | null
    recent_games: Array<Record<string, unknown>>
  }>(`select * from player_headline($1${filters})`, [playerId])
  expect(res.rows).toHaveLength(1)
  return res.rows[0]
}

describe("player_headline", () => {
  it("counts decided games and matches only, with denominators", async () => {
    const h = await headline(sam)
    // decided games: A1 (won), A2 (lost), B1 + B2 (won) — A3 is undecided
    expect(h.games_won).toBe(3)
    expect(h.games_decided).toBe(4)
    // match A drawn 1–1 → no winner → not decided; match B won
    expect(h.matches_won).toBe(1)
    expect(h.matches_decided).toBe(1)
  })

  it("returns recent games newest-first with scores from the player's side", async () => {
    const h = await headline(dave)
    expect(h.recent_games).toHaveLength(3) // Dave only played match A
    const [g3, g2, g1] = h.recent_games
    // newest first: game 3 (undecided), then 2, then 1
    expect(g3).toMatchObject({
      match_id: matchA,
      game_number: 3,
      opponent_id: sam,
      player_score: 1,
      opponent_score: 1,
      won: null,
    })
    expect(g2).toMatchObject({
      game_number: 2,
      player_score: 2,
      opponent_score: 0,
      won: true,
    })
    expect(g1).toMatchObject({
      game_number: 1,
      player_score: 1,
      opponent_score: 3,
      won: false,
    })
  })

  it("filters by opponent", async () => {
    const res = await db.query<{ games_won: number; games_decided: number }>(
      `select * from player_headline($1, p_opponent_id => $2)`,
      [sam, dave]
    )
    expect(res.rows[0]).toMatchObject({ games_won: 1, games_decided: 2 })
  })

  it("filters by ball type", async () => {
    const res = await db.query<{ games_won: number; games_decided: number }>(
      `select * from player_headline($1, p_ball_type => 'double_yellow')`,
      [sam]
    )
    expect(res.rows[0]).toMatchObject({ games_won: 2, games_decided: 2 })
  })

  it("filters by date range", async () => {
    const before = await db.query<{ games_decided: number }>(
      `select * from player_headline($1, p_date_to => '2026-06-05')`,
      [sam]
    )
    expect(before.rows[0].games_decided).toBe(2) // match A only
    const after = await db.query<{ games_decided: number }>(
      `select * from player_headline($1, p_date_from => '2026-06-10')`,
      [sam]
    )
    expect(after.rows[0].games_decided).toBe(2) // match B only
  })
})

describe("signature trait (§3.2 thresholds)", () => {
  it("grinder at exactly a 10-point gap with exactly 30 rallies per bucket", async () => {
    const [gina, hank] = await seedPlayers("Gina", "Hank")
    const game = await seedGame(await seedMatch(gina, hank, "2026-06-20"), 1)
    // short 18/30 = 60%, long 21/30 = 70% — the gap is exactly 10 points
    await seedRallies(game, gina, [
      ...bucket(gina, hank, 30, 18, 2),
      ...bucket(gina, hank, 30, 21, 10),
    ])
    expect((await headline(gina)).signature_trait).toBe("grinder")
    // …and the same data reads as shotmaker from the other side of the net
    // (Hank: short 12/30 = 40%, long 9/30 = 30%)
    expect((await headline(hank)).signature_trait).toBe("shotmaker")
  })

  it("omitted at 29 in a bucket — lets and untagged lengths don't count", async () => {
    const [ivy, jack] = await seedPlayers("Ivy", "Jack")
    const game = await seedGame(await seedMatch(ivy, jack, "2026-06-21"), 1)
    await seedRallies(game, ivy, [
      ...bucket(ivy, jack, 30, 20, 2),
      ...bucket(ivy, jack, 29, 25, 10),
      // would be the 30th long rally if wrongly counted:
      { winner: null, shotCount: 10 }, // a let
      { winner: ivy, shotCount: null }, // an untagged length
    ])
    expect((await headline(ivy)).signature_trait).toBeNull()
  })

  it("balanced when the gap is under 10 points", async () => {
    const [mia, ned] = await seedPlayers("Mia", "Ned")
    const game = await seedGame(await seedMatch(mia, ned, "2026-06-22"), 1)
    // short 18/30 = 60%, long 20/30 ≈ 66.7% — a 6.7-point gap
    await seedRallies(game, mia, [
      ...bucket(mia, ned, 30, 18, 2),
      ...bucket(mia, ned, 30, 20, 10),
    ])
    expect((await headline(mia)).signature_trait).toBe("balanced")
  })
})

describe("players_headline", () => {
  it("returns one row per player, matching the single-player RPC", async () => {
    const all = await db.query<{
      player_id: string
      name: string
      games_won: number
      games_decided: number
    }>(`select * from players_headline()`)
    const count = await db.query<{ n: number }>(
      `select count(*)::int as n from players`
    )
    expect(all.rows).toHaveLength(count.rows[0].n)
    const samRow = all.rows.find((r) => r.player_id === sam)!
    const single = await headline(sam)
    expect(samRow).toMatchObject({
      name: "Sam",
      games_won: single.games_won,
      games_decided: single.games_decided,
    })
  })
})

describe("h2h", () => {
  it("reports the pair's record from the first argument's perspective", async () => {
    const res = await db.query<{
      games_won_p1: number
      games_won_p2: number
      games_decided: number
      matches_won_p1: number
      matches_won_p2: number
      matches_decided: number
      match_history: Array<Record<string, unknown>>
    }>(`select * from h2h($1, $2)`, [sam, dave])
    expect(res.rows[0]).toMatchObject({
      games_won_p1: 1,
      games_won_p2: 1,
      games_decided: 2,
      matches_won_p1: 0,
      matches_won_p2: 0,
      matches_decided: 0,
    })
    expect(res.rows[0].match_history).toEqual([
      {
        match_id: matchA,
        date: "2026-06-01",
        games_won_p1: 1,
        games_won_p2: 1,
        winner_id: null,
      },
    ])
  })

  it("flips cleanly when the arguments swap", async () => {
    const res = await db.query<{ games_won_p1: number; games_won_p2: number }>(
      `select * from h2h($1, $2)`,
      [alex, sam]
    )
    expect(res.rows[0]).toMatchObject({ games_won_p1: 0, games_won_p2: 2 })
  })

  it("h2h_rallies returns the same rally set the aggregate counted", async () => {
    const res = await db.query<{ rally_number: number; is_let: boolean }>(
      `select rally_number, is_let from h2h_rallies($1, $2)`,
      [sam, dave]
    )
    expect(res.rows).toHaveLength(9) // 5 + 2 + 2, the let included as a row
    expect(res.rows.filter((r) => r.is_let)).toHaveLength(1)
  })
})

describe("API exposure", () => {
  it.each([
    "filtered_matches(uuid, uuid, ball_type, date, date)",
    "filtered_games(uuid, uuid, ball_type, date, date)",
    "filtered_rallies(uuid, uuid, ball_type, date, date)",
    "player_headline(uuid, uuid, ball_type, date, date)",
    "players_headline()",
    "h2h(uuid, uuid, ball_type, date, date)",
    "h2h_rallies(uuid, uuid, ball_type, date, date)",
  ])("anon can execute %s", async (signature) => {
    const res = await db.query<{ ok: boolean }>(
      `select has_function_privilege('anon', 'public.${signature}', 'execute') as ok`
    )
    expect(res.rows[0].ok).toBe(true)
  })
})
