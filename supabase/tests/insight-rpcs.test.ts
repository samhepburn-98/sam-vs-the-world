import { PGlite } from "@electric-sql/pglite"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { applyMigrations } from "./migrations"

// Insight-RPC fixture tests (§8.7 #1): player_headline(s) + h2h and the shared
// filter helpers, asserted row-by-row against seeded games covering lets, an
// undecided game, every filter param, and the §3.2 signature trait at its
// cutoffs.
//
// The whole migration set is applied, so the RPCs under test are the ones
// production ships. That matters most for the trait: it is the two-axis
// tempo × agency matrix of 20260825120000_trait_matrix, not the single
// rally-length differential (grinder / shotmaker / balanced) it replaced, and
// the fixtures below can no longer write an end reason the schema retired.

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

interface RallySpec {
  winner: string | null
  shotCount?: number | null
  reason?: string
}

/**
 * winner null = let; shotCount null = untagged rally length; reason defaults
 * to 'winner' — pass 'error' for a point the opponent handed over, which is
 * what separates the agency columns of the trait matrix.
 *
 * Shot counts here are deliberately never 1 unless a case says so: a 1-shot
 * winner taken by the server is a derived ace (20260710160000), so a fixture
 * that wants a plain rally winner has to give the rally a real length.
 */
async function seedRallies(
  gameId: string,
  server: string,
  rallies: Array<RallySpec>
) {
  if (rallies.length === 0) return
  // one statement, not one round trip per rally: the cutoff fixtures below run
  // to a hundred rallies apiece
  const params: Array<unknown> = [gameId, server]
  const values = rallies.map((r, i) => {
    const at = params.length
    params.push(
      r.winner,
      r.winner === null ? "let" : (r.reason ?? "winner"),
      r.shotCount ?? null
    )
    return `($1, ${i + 1}, $2, 'left', 1, $${at + 1}::uuid, $${at + 2}::public.end_reason, $${at + 3}::smallint)`
  })
  await db.query(
    `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason, shot_count)
     values ${values.join(", ")}`,
    params
  )
}

/**
 * `n` rallies at one shot count: `wins` of them won by `player`, of which
 * `cleanWins` end on the player's own racket and the rest on the opponent's
 * error. The opponent's own rallies are always their own winners, so the
 * agency axis only ever moves for `player`.
 */
function bucket(
  player: string,
  other: string,
  n: number,
  wins: number,
  shotCount: number,
  cleanWins = wins
) {
  return Array.from({ length: n }, (_, i) => ({
    winner: i < wins ? player : other,
    shotCount,
    reason: i < wins && i >= cleanWins ? "error" : "winner",
  }))
}

let sam: string
let dave: string
let alex: string
let matchA: string
let matchB: string

beforeAll(async () => {
  db = new PGlite()
  await applyMigrations(db)
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
    clean_finish_wins: number
    points_won: number
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

// The trait is a matrix (§3.2): a tempo row — short (1–3 shot) win rate minus
// extended (5+ shot) win rate, ±8 points marking a lean — crossed with an
// agency column, the share of the player's won points their own racket
// finished (≥55% finisher, ≤43% pressure). It is withheld below ≥30 rallies
// in each tempo bucket and ≥30 points won.
//
// Every case sits ON a cutoff, because that is where a silent redefinition
// shows first. Bucket sizes are picked so the cutoffs land exactly: at 50
// rallies one result moves a win rate by 2 points, and 43% only falls on a
// whole point at a hundred.
describe("signature trait (§3.2 cutoffs)", () => {
  it("names the tempo row at exactly an 8-point gap, and flips it at the net", async () => {
    const [gina, hank] = await seedPlayers("Gina", "Hank")
    const game = await seedGame(await seedMatch(gina, hank, "2026-06-20"), 1)
    // Gina takes 27/50 short (54%) and 23/50 extended (46%) — a +8-point
    // short-court lean, dead on the cutoff
    await seedRallies(game, gina, [
      ...bucket(gina, hank, 50, 27, 2),
      ...bucket(gina, hank, 50, 23, 10),
    ])
    // every rally ends on its winner's own racket, so both players sit in the
    // finisher column and only the tempo row varies
    expect((await headline(gina)).signature_trait).toBe("sniper")
    // Hank holds the mirror image — 23/50 short, 27/50 extended — so the same
    // rallies read as the long-court finisher from his side of the net
    expect((await headline(hank)).signature_trait).toBe("hunter")
  })

  it("lands in the neutral cell when neither axis reaches its cutoff", async () => {
    const [mia, ned] = await seedPlayers("Mia", "Ned")
    const game = await seedGame(await seedMatch(mia, ned, "2026-06-22"), 1)
    // one result short of a lean: 26/50 short (52%) against 23/50 extended
    // (46%) is a 6-point gap. Mia finishes her short points herself and is
    // handed every extended one, so her clean share is 26/49 ≈ 53% — inside
    // both agency cutoffs.
    await seedRallies(game, mia, [
      ...bucket(mia, ned, 50, 26, 2),
      ...bucket(mia, ned, 50, 23, 10, 0),
    ])
    expect(await headline(mia)).toMatchObject({
      clean_finish_wins: 26,
      points_won: 49,
      signature_trait: "all_rounder",
    })
  })

  it("names the agency column at exactly 55% and exactly 43%", async () => {
    // both players below sweep every rally, which pins the tempo row flat at
    // zero and leaves the column as the only thing under test
    const [marla, otto] = await seedPlayers("Marla", "Otto")
    const marlaGame = await seedGame(
      await seedMatch(marla, otto, "2026-06-23"),
      1
    )
    await seedRallies(marlaGame, marla, [
      ...bucket(marla, otto, 30, 30, 2),
      ...bucket(marla, otto, 30, 30, 10, 3), // 33 of her 60 points are her own
    ])
    // §3.5 wants the receipt, not a bare rate — the numerator and denominator
    // come back on the row that names the trait
    expect(await headline(marla)).toMatchObject({
      clean_finish_wins: 33,
      points_won: 60, // 33/60 = 55% exactly → the finisher column
      signature_trait: "marksman",
    })

    const [percy, quinn] = await seedPlayers("Percy", "Quinn")
    const percyGame = await seedGame(
      await seedMatch(percy, quinn, "2026-06-24"),
      1
    )
    await seedRallies(percyGame, percy, [
      ...bucket(percy, quinn, 50, 50, 2, 43),
      ...bucket(percy, quinn, 50, 50, 10, 0),
    ])
    expect(await headline(percy)).toMatchObject({
      clean_finish_wins: 43,
      points_won: 100, // 43/100 = 43% exactly → the pressure column
      signature_trait: "grafter",
    })
  })

  it("withheld until both tempo buckets hold 30 rallies", async () => {
    const [ivy, jack] = await seedPlayers("Ivy", "Jack")
    const game = await seedGame(await seedMatch(ivy, jack, "2026-06-21"), 1)
    await seedRallies(game, ivy, [
      ...bucket(ivy, jack, 30, 20, 2),
      ...bucket(ivy, jack, 29, 25, 10),
      // neither of these is an extended rally the guard can count:
      { winner: null, shotCount: 10 }, // a let has no winner
      { winner: ivy, shotCount: null }, // an untagged length has no bucket
    ])
    expect((await headline(ivy)).signature_trait).toBeNull()

    // the 30th real extended rally, and the same data names her — so the null
    // above was the bucket count and nothing else
    await db.query(
      `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason, shot_count)
       values ($1, 62, $2, 'left', 1, $2, 'winner', 10)`,
      [game, ivy]
    )
    expect((await headline(ivy)).signature_trait).toBe("hunter")
  })

  it("withheld under 30 points won, however the buckets look", async () => {
    const [rita, stan] = await seedPlayers("Rita", "Stan")
    const game = await seedGame(await seedMatch(rita, stan, "2026-06-25"), 1)
    // both buckets clear 30 rallies and neither axis leans, so the points
    // floor is the only thing left holding the trait back
    await seedRallies(game, rita, [
      ...bucket(rita, stan, 30, 14, 2),
      ...bucket(rita, stan, 30, 15, 10),
    ])
    expect(await headline(rita)).toMatchObject({
      points_won: 29,
      signature_trait: null,
    })
    // Stan took the other 31 — one over the floor — off the same rallies
    expect(await headline(stan)).toMatchObject({
      points_won: 31,
      signature_trait: "marksman",
    })
  })
})

// The agency column counts clean finishes, which the RPC spells as the
// winner's own winner or ace. Ace is no longer an end reason anyone can write
// (20260710160000) — it is derived — so these two cases hold the definition
// from both ends and stop the fixtures above drifting back to a value the
// schema rejects.
describe("the retired 'ace' end reason", () => {
  it("counts a derived ace — a 1-shot winner by the server — as a clean finish", async () => {
    const [tess, ugo] = await seedPlayers("Tess", "Ugo")
    const game = await seedGame(await seedMatch(tess, ugo, "2026-06-26"), 1)
    await seedRallies(game, tess, [
      { winner: tess, shotCount: 1 }, // Tess serving: the ace, derived
      { winner: ugo, shotCount: 6, reason: "error" }, // Tess handed one back
    ])
    expect(await headline(tess)).toMatchObject({
      clean_finish_wins: 1,
      points_won: 1,
    })
  })

  it("cannot be written back in — the CHECK retires it", async () => {
    const [vic, walt] = await seedPlayers("Vic", "Walt")
    const game = await seedGame(await seedMatch(vic, walt, "2026-06-27"), 1)
    await expect(
      db.query(
        `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason, shot_count)
         values ($1, 1, $2, 'left', 1, $2, 'ace', 1)`,
        [game, vic]
      )
    ).rejects.toThrow(/rallies_end_reason_current/)
  })
})

describe("players_headline", () => {
  it("returns one row per player, matching the single-player RPC", async () => {
    const all = await db.query<{
      player_id: string
      name: string
      handedness: string | null
      games_won: number
      games_decided: number
      clean_finish_wins: number
      points_won: number
    }>(`select * from players_headline()`)
    const count = await db.query<{ n: number }>(
      `select count(*)::int as n from players`
    )
    expect(all.rows).toHaveLength(count.rows[0].n)
    const samRow = all.rows.find((r) => r.player_id === sam)!
    const single = await headline(sam)
    // the roster forwards the trait's receipt columns too, so a card can cite
    // the agency numbers without a second call
    expect(samRow).toMatchObject({
      name: "Sam",
      handedness: null,
      games_won: single.games_won,
      games_decided: single.games_decided,
      clean_finish_wins: single.clean_finish_wins,
      points_won: single.points_won,
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
        // a level casual session IS a draw — the RPC says so itself, so no
        // panel ever has to guess what a null winner means
        outcome: "draw",
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
