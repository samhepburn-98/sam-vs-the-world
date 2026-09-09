import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { PGlite } from "@electric-sql/pglite"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { gameFixture, matchFixture } from "../../fixtures/schema"

import { applyMigrations, applyMigrationsFrom } from "./migrations"

import type {
  FixtureRally,
  GameFixture,
  MatchFixture,
} from "../../fixtures/schema"

// SQL derivation suite (§8.7 #1) — runs the real migrations against PGlite
// (Postgres-in-WASM: no Docker, no cloud project, CI-safe) and asserts the
// views against the golden fixtures in fixtures/.
//
// "The real migrations" means all of them, through the shared bootstrap. This
// suite used to load five hand-picked files, which left the rallies table at
// its 2 July definition: the suite went on storing the 'ace' end reason for
// the seven weeks after a CHECK retired it, simply because the migration
// carrying that CHECK was never in the list. Every retirement between those
// picks was invisible here. The fixtures still write aces — see storedRally.

const ROOT = join(__dirname, "../..")

function loadFixtures<T>(dir: string, parse: (raw: unknown) => T): Array<T> {
  const base = join(ROOT, "fixtures", dir)
  return readdirSync(base)
    .filter((f) => f.endsWith(".json"))
    .map((f) => parse(JSON.parse(readFileSync(join(base, f), "utf8"))))
}

const gameFixtures = loadFixtures("games", (raw) => gameFixture.parse(raw))
const matchFixtures = loadFixtures("matches", (raw) => matchFixture.parse(raw))

let db: PGlite

beforeAll(async () => {
  db = new PGlite()
  await applyMigrations(db)
})

afterAll(async () => {
  await db.close()
})

/**
 * A fixture rally as the table stores it today.
 *
 * The golden fixtures are shared with the TS scoring engine (§8.7 #2) and
 * still spell an ace as its own end reason. The database no longer does: on
 * 10 July `rallies_end_reason_current` retired the value (20260710160000),
 * because the columns beside it already said everything the value did — the
 * first shot of a rally is the serve, so a one-shot winner IS the server
 * winning on the serve. That migration rewrote the live rows as `winner` with
 * `shot_count` pinned to 1, and fixtures get the identical rewrite on the way
 * in (proven against the migration itself at the foot of this file). The
 * derivation is then asserted back out of the views, so the coverage the
 * stored value used to carry moves to where the meaning now lives rather than
 * quietly disappearing.
 */
function storedRally(r: FixtureRally): {
  endReason: Exclude<FixtureRally["endReason"], "ace">
  shotCount: number | null
} {
  if (r.endReason === "ace") return { endReason: "winner", shotCount: 1 }
  return { endReason: r.endReason, shotCount: r.shotCount ?? null }
}

/** the rally numbers a fixture expects to read back as derived aces */
function fixtureAceNumbers(f: GameFixture): Array<number> {
  return f.rallies.flatMap((r, i) => (r.endReason === "ace" ? [i + 1] : []))
}

/** the least a rally needs to exist: two players, a match, a game */
async function seedGame(target: PGlite, name: string) {
  const players = await target.query<{ id: string }>(
    `insert into players (name) values ($1), ($2) returning id`,
    [`${name}-p1`, `${name}-p2`]
  )
  const [p1, p2] = players.rows.map((r) => r.id)
  const match = await target.query<{ id: string }>(
    `insert into matches (player1_id, player2_id) values ($1, $2) returning id`,
    [p1, p2]
  )
  const game = await target.query<{ id: string }>(
    `insert into games (match_id, game_number) values ($1, 1) returning id`,
    [match.rows[0].id]
  )
  return { p1, p2, matchId: match.rows[0].id, gameId: game.rows[0].id }
}

async function insertGame(f: GameFixture) {
  const players = await db.query<{ id: string }>(
    `insert into players (name) values ($1), ($2) returning id`,
    [`${f.name}-p1`, `${f.name}-p2`]
  )
  const [p1, p2] = players.rows.map((r) => r.id)
  const ids = { p1: p1, p2: p2 }
  const match = await db.query<{ id: string }>(
    `insert into matches (player1_id, player2_id, target_score, tiebreak, serves_per_point)
     values ($1, $2, $3, $4, $5) returning id`,
    [ids.p1, ids.p2, f.targetScore, f.tiebreak, f.servesPerPoint ?? 2]
  )
  const matchId = match.rows[0].id
  const game = await db.query<{ id: string }>(
    `insert into games (match_id, game_number) values ($1, 1) returning id`,
    [matchId]
  )
  const gameId = game.rows[0].id
  for (const [i, r] of f.rallies.entries()) {
    const stored = storedRally(r)
    await db.query(
      `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number,
                            winner_id, end_reason, error_detail, forced, shot_count)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        gameId,
        i + 1,
        ids[r.server],
        r.side,
        r.serveNumber,
        r.winner ? ids[r.winner] : null,
        stored.endReason,
        r.errorDetail ?? null,
        r.forced ?? null,
        stored.shotCount,
      ]
    )
  }
  return { ids, matchId, gameId }
}

describe.each(gameFixtures.map((f) => [f.name, f] as const))(
  "game fixture: %s",
  (_name, f) => {
    it("derives the running score for every rally (lets carry, never advance)", async () => {
      const { gameId } = await insertGame(f)
      const rows = await db.query<{
        rally_number: number
        score_p1: number
        score_p2: number
        is_let: boolean
        end_reason: string
        shot_count: number | null
        server_id: string
        winner_id: string | null
      }>(
        `select rally_number, score_p1::int, score_p2::int, is_let,
                end_reason, shot_count, server_id, winner_id
         from rallies_scored where game_id = $1 order by rally_number`,
        [gameId]
      )
      expect(rows.rows.map((r) => [r.score_p1, r.score_p2])).toEqual(
        f.expected.runningScores
      )
      for (const [i, r] of rows.rows.entries()) {
        expect(r.is_let).toBe(f.rallies[i].endReason === "let")
      }

      const result = await db.query<{
        score_p1: number
        score_p2: number
        winner_id: string | null
        is_undecided: boolean
      }>(
        `select score_p1::int, score_p2::int, winner_id, is_undecided
         from game_results where game_id = $1`,
        [gameId]
      )
      const got = result.rows[0]
      const { ids } = await (async () => {
        // map back: fetch the two players of this game's match
        const m = await db.query<{ player1_id: string; player2_id: string }>(
          `select m.player1_id, m.player2_id from games g join matches m on m.id = g.match_id where g.id = $1`,
          [gameId]
        )
        return { ids: { p1: m.rows[0].player1_id, p2: m.rows[0].player2_id } }
      })()
      expect(got.score_p1).toBe(f.expected.result.scoreP1)
      expect(got.score_p2).toBe(f.expected.result.scoreP2)
      expect(got.winner_id).toBe(
        f.expected.result.winner ? ids[f.expected.result.winner] : null
      )
      expect(got.is_undecided).toBe(f.expected.result.undecided)

      // Aces are derived rather than stored (20260710160000), so assert the
      // derivation in both directions: every fixture ace reads back out of
      // the view as a winner the server took on one shot, and no other rally
      // does. The second half matters as much as the first — shot_count is
      // the whole of the tell, so a plain winner logged without a rally
      // length must never pass for an ace.
      expect(
        rows.rows
          .filter(
            (r) =>
              r.end_reason === "winner" &&
              r.shot_count === 1 &&
              r.winner_id === r.server_id
          )
          .map((r) => r.rally_number)
      ).toEqual(fixtureAceNumbers(f))

      // and the stat that reads the derivation agrees: serve_stats.aces
      // counts exactly that shape, per server. Every fixture inserts its own
      // pair of players, so the tally is this game's alone.
      for (const side of ["p1", "p2"] as const) {
        const serve = await db.query<{ aces: number }>(
          `select aces from serve_stats($1)`,
          [ids[side]]
        )
        expect(serve.rows[0].aces).toBe(
          f.rallies.filter((r) => r.endReason === "ace" && r.server === side)
            .length
        )
      }

      if (f.expected.errors) {
        const errs = await db.query<{
          rally_number: number
          error_maker_id: string
          end_reason: string
        }>(
          `select rally_number, error_maker_id, end_reason
           from errors_attributed where game_id = $1 order by rally_number`,
          [gameId]
        )
        expect(
          errs.rows.map((e) => ({
            rallyNumber: e.rally_number,
            maker: e.error_maker_id === ids.p1 ? "p1" : "p2",
            endReason: e.end_reason,
          }))
        ).toEqual(f.expected.errors)
      }
    })
  }
)

async function insertMatch(f: MatchFixture) {
  const players = await db.query<{ id: string }>(
    `insert into players (name) values ($1), ($2) returning id`,
    [`${f.name}-p1`, `${f.name}-p2`]
  )
  const [p1, p2] = players.rows.map((r) => r.id)
  const ids = { p1: p1, p2: p2 }
  const match = await db.query<{ id: string }>(
    `insert into matches (player1_id, player2_id, format) values ($1, $2, $3) returning id`,
    [ids.p1, ids.p2, f.format]
  )
  const matchId = match.rows[0].id
  for (const [i, w] of f.gameWinners.entries()) {
    const game = await db.query<{ id: string }>(
      `insert into games (match_id, game_number) values ($1, $2) returning id`,
      [matchId, i + 1]
    )
    const gameId = game.rows[0].id
    // shot_count is left null throughout: these rallies exist to settle a
    // game, and a 1-shot winner by the server would read as an ace (above).
    if (w === "tie") {
      // one rally each: tied, undecided
      await db.query(
        `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason)
         values ($1, 1, $2, 'left', 1, $2, 'winner'), ($1, 2, $2, 'left', 1, $3, 'winner')`,
        [gameId, ids.p1, ids.p2]
      )
    } else {
      await db.query(
        `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason)
         values ($1, 1, $2, 'left', 1, $3, 'winner')`,
        [gameId, ids.p1, ids[w]]
      )
    }
  }
  return { ids, matchId }
}

describe.each(matchFixtures.map((f) => [f.name, f] as const))(
  "match fixture: %s",
  (_name, f) => {
    it("tallies decided games and resolves the match winner", async () => {
      const { ids, matchId } = await insertMatch(f)
      const rows = await db.query<{
        games_won_p1: number
        games_won_p2: number
        match_winner_id: string | null
        created_at: string | null
        outcome: string
      }>(
        `select games_won_p1::int, games_won_p2::int, match_winner_id, created_at, outcome
         from match_results where match_id = $1`,
        [matchId]
      )
      const got = rows.rows[0]
      expect(got.games_won_p1).toBe(f.expected.gamesWonP1)
      expect(got.games_won_p2).toBe(f.expected.gamesWonP2)
      expect(got.match_winner_id).toBe(
        f.expected.matchWinner ? ids[f.expected.matchWinner] : null
      )
      // the recent-results read orders by this — the view must expose it
      expect(got.created_at).not.toBeNull()
      // the verdict every component renders — draw and pending included
      expect(got.outcome).toBe(f.expected.outcome)
    })
  }
)

describe("retired values stay locked out", () => {
  // The pins. Both of these were insertable in the frozen five-migration
  // schema this suite used to build, long after production stopped taking
  // them — and the fixture schema still admits both spellings, with
  // insertGame passing error_detail straight through. If the bootstrap is
  // ever narrowed again, these are the tests that fail first, naming the
  // constraint that should have caught it.
  let gameId: string
  let server: string

  beforeAll(async () => {
    const seeded = await seedGame(db, "retired-values")
    gameId = seeded.gameId
    server = seeded.p1
  })

  it("rejects the 'ace' end reason — an ace is derived now", async () => {
    await expect(
      db.query(
        `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number,
                              winner_id, end_reason, shot_count)
         values ($1, 1, $2, 'left', 1, $2, 'ace', 1)`,
        [gameId, server]
      )
    ).rejects.toThrow(/rallies_end_reason_current/)
  })

  it("rejects the 'double_bounce' error detail — it folds into not_up", async () => {
    await expect(
      db.query(
        `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number,
                              winner_id, end_reason, error_detail)
         values ($1, 2, $2, 'left', 1, $2, 'error', 'double_bounce')`,
        [gameId, server]
      )
    ).rejects.toThrow(/rallies_error_detail_current/)
  })
})

describe("the ace retirement (20260710160000)", () => {
  it("folds a legacy ace row into exactly the shape storedRally writes", async () => {
    // storedRally rewrites a fixture's ace on the way in; this is what keeps
    // that rewrite honest rather than a convenient guess. The same row,
    // written the old way on the pre-retirement schema and then migrated
    // forwards, must land where storedRally puts it. It needs its own
    // database because the point of the test is the "before", and `db` is
    // already at the current schema.
    const legacy = new PGlite()
    try {
      await applyMigrations(legacy, { stopBefore: "last_shot_derived_ace" })
      const seeded = await seedGame(legacy, "legacy-ace")
      // the old notation: an explicit 'ace', no rally length recorded
      await legacy.query(
        `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason)
         values ($1, 1, $2, 'left', 1, $2, 'ace')`,
        [seeded.gameId, seeded.p1]
      )

      await applyMigrationsFrom(legacy, "last_shot_derived_ace")

      const row = await legacy.query<{
        end_reason: string
        shot_count: number | null
        server_won: boolean
      }>(
        `select end_reason, shot_count, (winner_id = server_id) as server_won
         from rallies where game_id = $1`,
        [seeded.gameId]
      )
      expect(row.rows[0]).toEqual({
        end_reason: "winner",
        shot_count: 1,
        server_won: true,
      })
      expect(
        storedRally({
          server: "p1",
          side: "left",
          serveNumber: 1,
          winner: "p1",
          endReason: "ace",
        })
      ).toEqual({ endReason: "winner", shotCount: 1 })

      // and the value is shut out from here on
      await expect(
        legacy.query(
          `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason)
           values ($1, 2, $2, 'left', 1, $2, 'ace')`,
          [seeded.gameId, seeded.p1]
        )
      ).rejects.toThrow(/rallies_end_reason_current/)
    } finally {
      await legacy.close()
    }
  })
})
