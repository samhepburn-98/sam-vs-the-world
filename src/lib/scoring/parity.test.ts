import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { gameFixture, matchFixture } from "../../../fixtures/schema"
import { gameResult, runningScores } from "./score"
import { tallyMatch } from "./match"

import type { GameFixture, MatchFixture } from "../../../fixtures/schema"
import type { GameResult, RallyInput } from "./types"

// Parity suite (§8.7 #2): the TS engine consumes the SAME golden fixtures as
// the SQL derivation suite (supabase/tests/derivation.test.ts). If either
// implementation drifts from the shared truth, one of the two suites fails.

const FIXTURES = join(__dirname, "../../../fixtures")

function load<T>(dir: string, parse: (raw: unknown) => T): Array<T> {
  const base = join(FIXTURES, dir)
  return readdirSync(base)
    .filter((f) => f.endsWith(".json"))
    .map((f) => parse(JSON.parse(readFileSync(join(base, f), "utf8"))))
}

const gameFixtures = load("games", (raw) => gameFixture.parse(raw))
const matchFixtures = load("matches", (raw) => matchFixture.parse(raw))

const IDS = { p1: "player-one", p2: "player-two" } as const
const ctx = { player1Id: IDS.p1, player2Id: IDS.p2 }

function toRallies(f: GameFixture): Array<RallyInput> {
  return f.rallies.map((r) => ({
    serverId: IDS[r.server],
    serveSide: r.side,
    serveNumber: r.serveNumber,
    winnerId: r.winner ? IDS[r.winner] : null,
    endReason: r.endReason,
  }))
}

describe.each(gameFixtures.map((f) => [f.name, f] as const))(
  "game fixture: %s",
  (_name, f) => {
    const rallies = toRallies(f)

    it("derives the identical running score for every rally", () => {
      expect(
        runningScores(rallies, ctx).map((s) => [s.p1, s.p2]),
      ).toEqual(f.expected.runningScores)
    })

    it("derives the identical game result", () => {
      const got = gameResult(rallies, ctx)
      expect(got.score.p1).toBe(f.expected.result.scoreP1)
      expect(got.score.p2).toBe(f.expected.result.scoreP2)
      expect(got.winnerId).toBe(
        f.expected.result.winner ? IDS[f.expected.result.winner] : null,
      )
      expect(got.undecided).toBe(f.expected.result.undecided)
    })
  },
)

describe.each(matchFixtures.map((f) => [f.name, f] as const))(
  "match fixture: %s",
  (_name, f: MatchFixture) => {
    it("derives the identical match tally", () => {
      const games: Array<GameResult> = f.gameWinners.map((w) => ({
        score: w === "p1" ? { p1: 1, p2: 0 } : w === "p2" ? { p1: 0, p2: 1 } : { p1: 1, p2: 1 },
        winnerId: w === "tie" ? null : IDS[w],
        undecided: w === "tie",
      }))
      const got = tallyMatch(games, { ...ctx, format: f.format })
      expect(got.gamesWonP1).toBe(f.expected.gamesWonP1)
      expect(got.gamesWonP2).toBe(f.expected.gamesWonP2)
      expect(got.matchWinnerId).toBe(
        f.expected.matchWinner ? IDS[f.expected.matchWinner] : null,
      )
    })
  },
)
