import { PGlite } from "@electric-sql/pglite"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { applyMigrations, applyMigrationsFrom } from "./migrations"

// records() fixture tests: every record block pinned against a seeded
// timeline — the first-achiever tie rule, the exclusions (lets and untagged
// rallies from longest_rally, pending matches from streaks), lets counting
// toward the marathon, and the derived-ace predicate.
//
// The whole migration chain is applied (§8.7 #1). This suite used to load
// five hand-picked files and deliberately skip derive_aces, which meant the
// one thing the records migration pins its ace block to — "the same
// predicate as serve_stats" — was a claim no test here could check, because
// serve_stats wasn't in the database. It is now, and they are compared.

interface RecordRow {
  record_key: string
  player_id: string | null
  player1_id: string
  player2_id: string
  value: number
  detail: string | null
  match_id: string
  date: string
}

let db: PGlite
let sam: string
let alex: string
let ormond: string

interface RallySpec {
  winner: string | null
  shotCount?: number | null
  server?: string
  reason?: string
}

async function seedMatch(p1: string, p2: string, date: string) {
  const res = await db.query<{ id: string }>(
    `insert into matches (player1_id, player2_id, date) values ($1, $2, $3) returning id`,
    [p1, p2, date]
  )
  return res.rows[0].id
}

async function seedGame(
  matchId: string,
  rallies: Array<RallySpec>,
  gameNumber = 1
) {
  const game = await db.query<{ id: string }>(
    `insert into games (match_id, game_number) values ($1, $2) returning id`,
    [matchId, gameNumber]
  )
  // default server: the match's own player one (the trigger rejects outsiders)
  const host = await db.query<{ player1_id: string }>(
    `select player1_id from matches where id = $1`,
    [matchId]
  )
  let n = 0
  for (const r of rallies) {
    n += 1
    // shot_count goes in explicitly, null when the spec doesn't name one: a
    // plain winner has to stay untagged, because a 1-shot winner served by
    // its own winner IS an ace under the derived definition and would be
    // counted into most_aces.
    await db.query(
      `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason, shot_count)
       values ($1, $2, $3, 'left', $4, $5, $6, $7)`,
      [
        game.rows[0].id,
        n,
        r.server ?? host.rows[0].player1_id,
        r.reason === "serve_fault" ? 2 : 1,
        r.winner,
        r.reason ?? (r.winner === null ? "let" : "winner"),
        r.shotCount ?? null,
      ]
    )
  }
  return game.rows[0].id
}

/** A casual match decided g1–g2 in games (each game a minimal 1–0 or the
 *  given rallies). Returns the match id. */
async function decidedMatch(
  p1: string,
  p2: string,
  date: string,
  gamesP1: number,
  gamesP2: number
) {
  const match = await seedMatch(p1, p2, date)
  let g = 0
  for (let i = 0; i < gamesP1; i += 1) {
    g += 1
    await seedGame(match, [{ winner: p1 }], g)
  }
  for (let i = 0; i < gamesP2; i += 1) {
    g += 1
    await seedGame(match, [{ winner: p2 }], g)
  }
  return match
}

async function records(): Promise<Map<string, RecordRow>> {
  const res = await db.query<RecordRow>(`select * from records()`)
  return new Map(res.rows.map((r) => [r.record_key, r]))
}

beforeAll(async () => {
  db = new PGlite()
  await applyMigrations(db)

  const players = await db.query<{ id: string }>(
    `insert into players (name) values ('Sam'), ('Alex'), ('Ormond') returning id`
  )
  ;[sam, alex, ormond] = players.rows.map((r) => r.id)
})

afterAll(async () => {
  await db.close()
})

describe("records() on an empty database", () => {
  it("returns no rows before anything is logged", async () => {
    const res = await db.query(`select * from records()`)
    expect(res.rows).toHaveLength(0)
  })
})

describe("records() over the seeded timeline", () => {
  let biggestWinMatch: string
  let longestRallyMatch: string
  let marathonMatch: string
  let acesMatch: string
  let aceTieMatch: string
  let letsMatch: string

  beforeAll(async () => {
    // -- streak + biggest-win timeline (played order = date, created_at) ----
    // Jun 1  Sam d. Alex 2–0     Sam W1        (margin 2)
    // Jun 2  Sam d. Ormond 3–0   Sam W2        (margin 3 — first at 3)
    // Jun 3  Alex d. Ormond 3–0  (margin 3 — later, must NOT take the record)
    // Jun 4  Sam – Alex drawn 1–1  (severs Sam's opening W2)
    // Jun 6–8   three Sam wins, with a PENDING Sam match seeded mid-run on
    //           Jun 7 (one tied game) that must neither extend nor break it
    // Jun 10–12 the rally/marathon/aces fixtures below — all Sam wins too,
    //           so Sam's record run is W6 (Jun 6 → the aces match): 8 had
    //           the draw not severed, 4 had the pending match broken it.
    await decidedMatch(sam, alex, "2026-06-01", 2, 0)
    biggestWinMatch = await decidedMatch(sam, ormond, "2026-06-02", 3, 0)
    // same margin, SAME date, created later — the created_at tail must keep
    // the record with the first 3–0 logged that evening
    await decidedMatch(ormond, alex, "2026-06-02", 3, 0)
    await decidedMatch(alex, ormond, "2026-06-03", 3, 0)

    const drawn = await seedMatch(sam, alex, "2026-06-04")
    await seedGame(drawn, [{ winner: sam }], 1)
    await seedGame(drawn, [{ winner: alex }], 2)

    await decidedMatch(sam, alex, "2026-06-06", 1, 0)
    await decidedMatch(sam, ormond, "2026-06-07", 1, 0)
    const pending = await seedMatch(sam, ormond, "2026-06-07")
    await seedGame(pending, [{ winner: sam }, { winner: ormond }]) // tied game
    await decidedMatch(sam, alex, "2026-06-08", 1, 0)

    // -- longest rally: 23 shots to Alex; a longer let and an untagged rally
    //    must not count ---------------------------------------------------
    longestRallyMatch = await seedMatch(sam, alex, "2026-06-10")
    await seedGame(longestRallyMatch, [
      { winner: alex, shotCount: 23 },
      { winner: null, shotCount: 30 }, // a let is nobody's rally
      { winner: sam, shotCount: null }, // untagged — excluded
      { winner: sam, shotCount: 12 },
    ])

    // -- marathon: 5 rallies in one game, the let counted, final score 3–1 --
    marathonMatch = await seedMatch(sam, ormond, "2026-06-11")
    await seedGame(marathonMatch, [
      { winner: sam },
      { winner: ormond },
      { winner: null }, // let — still a rally played
      { winner: sam },
      { winner: sam },
    ])

    // -- aces: Sam serves two 1-shot winners in one match; a 1-shot winner
    //    by the RECEIVER is not an ace ------------------------------------
    acesMatch = await seedMatch(sam, alex, "2026-06-12")
    await seedGame(acesMatch, [
      { winner: sam, server: sam, shotCount: 1 },
      { winner: sam, server: sam, shotCount: 1 },
      { winner: alex, server: sam, shotCount: 1 }, // receiver's 1-shot winner
    ])

    // -- ace tie, WITHIN one match: both players ace twice in a pending
    //    Jun 9 match (tied game, so no streak/margin side effects). Sam
    //    completes his pair at rally 2, Alex at rally 4 — first to the
    //    count holds it, and the earlier DATE beats the equal Jun 12 count.
    aceTieMatch = await seedMatch(sam, alex, "2026-06-09")
    await seedGame(aceTieMatch, [
      { winner: sam, server: sam, shotCount: 1 },
      { winner: sam, server: sam, shotCount: 1 },
      { winner: alex, server: alex, shotCount: 1 },
      { winner: alex, server: alex, shotCount: 1 },
    ])

    // -- lets: three in one match ----------------------------------------
    letsMatch = await seedMatch(alex, ormond, "2026-06-13")
    await seedGame(letsMatch, [
      { winner: null },
      { winner: null },
      { winner: null },
      { winner: alex },
    ])

    // -- tie fixtures: equal values set LATER must not take a record ------
    // Alex strings five wins onto his Jun 13 one: a run of 6 equal to
    // Sam's, but reaching 6 on Jun 24 — after Sam reached it on Jun 12.
    for (let d = 20; d <= 24; d += 1) {
      await decidedMatch(alex, ormond, `2026-06-${d}`, 1, 0)
    }
    // A second 23-shot rally (Sam's, Jun 26) inside a PENDING match (tied
    // game), so it perturbs no streak or margin: Alex's Jun 10 rally holds.
    const rallyTie = await seedMatch(sam, alex, "2026-06-26")
    await seedGame(rallyTie, [{ winner: sam, shotCount: 23 }, { winner: alex }])
  })

  it("returns exactly the six records", async () => {
    const rows = await records()
    expect([...rows.keys()].sort()).toEqual([
      "best_streak",
      "biggest_win",
      "longest_rally",
      "marathon_game",
      "most_aces",
      "most_lets",
    ])
  })

  it("biggest_win: widest margin, held by the FIRST to set it", async () => {
    // three 3–0s exist: Sam's (Jun 2, logged first), Ormond's (Jun 2,
    // logged later — created_at breaks the same-day tie), Alex's (Jun 3)
    const r = (await records()).get("biggest_win")
    expect(r).toMatchObject({
      player_id: sam,
      value: 3,
      detail: "3–0",
      match_id: biggestWinMatch,
    })
  })

  it("longest_rally: lets and untagged excluded, a later equal stays second", async () => {
    // Sam's equal 23-shot rally on Jun 26 must not take Alex's Jun 10 record
    const r = (await records()).get("longest_rally")
    expect(r).toMatchObject({
      player_id: alex,
      value: 23,
      match_id: longestRallyMatch,
    })
  })

  it("best_streak: a draw breaks a run, a pending match does not, first to the length keeps it", async () => {
    // Sam's run is exactly 6 (Jun 6 → the aces match): 8 would mean the
    // Jun 4 draw failed to sever his opening W2, and 4 would mean the
    // pending Jun 7 match broke the run it sits inside. Alex's equal run
    // of 6 reaches that length on Jun 24 — later — so Sam holds.
    const r = (await records()).get("best_streak")
    expect(r).toMatchObject({
      player_id: sam,
      value: 6,
      match_id: acesMatch,
    })
  })

  it("marathon_game: counts every rally played, lets included", async () => {
    const r = (await records()).get("marathon_game")
    expect(r).toMatchObject({
      player_id: null,
      value: 5,
      detail: "3–1",
      match_id: marathonMatch,
    })
  })

  it("most_aces: derived aces; a within-match tie goes to the first to the count", async () => {
    // 2 aces each for Sam and Alex in the Jun 9 match, and 2 for Sam on
    // Jun 12: earliest date wins the cross-match tie, and inside Jun 9
    // Sam completed his pair first (rally 2 v rally 4)
    const r = (await records()).get("most_aces")
    expect(r).toMatchObject({
      player_id: sam,
      value: 2,
      match_id: aceTieMatch,
    })
  })

  it("most_aces: the wall counts exactly what serve_stats counts", async () => {
    // the records migration pins its ace block to serve_stats' predicate, so
    // hold the two together — a change to either that the other doesn't
    // follow means the wall and the profile disagree about the same match
    const acesFor = async (player: string, opponent: string) =>
      (
        await db.query<{ aces: number }>(
          `select aces from serve_stats(p_player_id => $1, p_opponent_id => $2,
             p_date_from => '2026-06-09', p_date_to => '2026-06-09')`,
          [player, opponent]
        )
      ).rows[0].aces

    const samAces = await acesFor(sam, alex)
    expect(samAces).toBe(2)
    expect((await records()).get("most_aces")?.value).toBe(samAces)
    // and the tie is real: Alex served two of his own on the same night
    expect(await acesFor(alex, sam)).toBe(2)
  })

  it("most_lets: match-owned, no holder", async () => {
    const r = (await records()).get("most_lets")
    expect(r).toMatchObject({ player_id: null, value: 3, match_id: letsMatch })
  })

  it("every row carries the match pairing for captions", async () => {
    for (const r of (await records()).values()) {
      expect(r.player1_id).toBeTruthy()
      expect(r.player2_id).toBeTruthy()
      expect(r.match_id).toBeTruthy()
      expect(r.date).toBeTruthy()
    }
  })
})

// The ace retirement (20260710160000), from both sides. most_aces counts by
// derivation, so this file has to hold two things down: an ace logged before
// the retirement still reaches the wall, and the stored value it replaced is
// genuinely dead. The first has to be staged ACROSS the migration, which the
// fixture above — already at the current schema — can't do, hence a second
// database that starts before it and is then carried forward.
describe("the retired 'ace' end reason", () => {
  let legacy: PGlite
  let legacySam: string
  let legacyMatch: string
  let legacyGame: string

  beforeAll(async () => {
    legacy = new PGlite()
    // stop before the retirement, so the rally can be written the way July's
    // logger wrote one: a stored 'ace' with no shot count at all
    await applyMigrations(legacy, { stopBefore: "last_shot_derived_ace" })

    const players = await legacy.query<{ id: string }>(
      `insert into players (name) values ('Sam'), ('Alex') returning id`
    )
    const [p1, p2] = players.rows.map((r) => r.id)
    legacySam = p1
    const match = await legacy.query<{ id: string }>(
      `insert into matches (player1_id, player2_id, date)
       values ($1, $2, '2026-07-05') returning id`,
      [p1, p2]
    )
    legacyMatch = match.rows[0].id
    const game = await legacy.query<{ id: string }>(
      `insert into games (match_id, game_number) values ($1, 1) returning id`,
      [legacyMatch]
    )
    legacyGame = game.rows[0].id
    await legacy.query(
      `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason)
       values ($1, 1, $2, 'left', 1, $2, 'ace')`,
      [legacyGame, legacySam]
    )

    // ...then the retirement itself and everything after it
    await applyMigrationsFrom(legacy, "last_shot_derived_ace")
  })

  afterAll(async () => {
    await legacy.close()
  })

  it("folds a legacy row into the shape an ace always described", async () => {
    const row = await legacy.query<{ end_reason: string; shot_count: number }>(
      `select end_reason, shot_count from rallies where game_id = $1`,
      [legacyGame]
    )
    expect(row.rows[0]).toEqual({ end_reason: "winner", shot_count: 1 })
  })

  it("still reaches the wall, now by derivation", async () => {
    // the row was logged as a stored ace and is counted as a derived one —
    // the retirement cost the record nothing
    const res = await legacy.query<RecordRow>(
      `select * from records() where record_key = 'most_aces'`
    )
    expect(res.rows[0]).toMatchObject({
      player_id: legacySam,
      value: 1,
      match_id: legacyMatch,
    })
  })

  it("cannot be logged again", async () => {
    await expect(
      legacy.query(
        `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason)
         values ($1, 2, $2, 'left', 1, $2, 'ace')`,
        [legacyGame, legacySam]
      )
    ).rejects.toThrow(/rallies_end_reason_current/)
  })
})
