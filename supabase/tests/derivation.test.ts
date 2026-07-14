import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { PGlite } from "@electric-sql/pglite"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { gameFixture, matchFixture } from "../../fixtures/schema"

import type { GameFixture, MatchFixture } from "../../fixtures/schema"

// SQL derivation suite (§8.7 #1) — runs the real migrations against PGlite
// (Postgres-in-WASM: no Docker, no cloud project, CI-safe) and asserts the
// views against the golden fixtures in fixtures/.

const ROOT = join(__dirname, "../..")
const MIGRATIONS = join(ROOT, "supabase/migrations")

function loadMigration(nameFragment: string) {
  const file = readdirSync(MIGRATIONS).find((f) => f.includes(nameFragment))
  if (!file) throw new Error(`migration matching "${nameFragment}" not found`)
  // pgcrypto isn't needed (gen_random_uuid is core since PG13) and the
  // extension isn't bundled in PGlite — drop that single line.
  return readFileSync(join(MIGRATIONS, file), "utf8").replace(
    /^create extension if not exists pgcrypto;$/m,
    ""
  )
}

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
  // 0001 tables + 0002 views + 0005 house rules. RLS migrations (0003/0004)
  // reference the auth schema and were verified against the live project in
  // #8 — derivation correctness doesn't depend on them.
  await db.exec(loadMigration("enums_and_tables"))
  await db.exec(loadMigration("views"))
  await db.exec(loadMigration("house_rules"))
  // keeps the tested match_results shape identical to the live view
  await db.exec(loadMigration("match_results_created_at"))
  await db.exec(loadMigration("match_outcome"))
})

afterAll(async () => {
  await db.close()
})

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
        r.endReason,
        r.errorDetail ?? null,
        r.forced ?? null,
        r.shotCount ?? null,
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
      }>(
        `select rally_number, score_p1::int, score_p2::int, is_let
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
