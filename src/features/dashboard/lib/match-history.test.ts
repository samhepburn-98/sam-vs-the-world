import { describe, expect, it } from "vitest"

import { toHistoryMatches } from "@/features/dashboard/lib/match-history"

import type { GameResultInMatch } from "@/lib/schemas/game"
import type { MatchResultSummary } from "@/lib/schemas/match"

const SAM = "11111111-1111-1111-1111-111111111111"
const WOODY = "22222222-2222-2222-2222-222222222222"
const MATCH = "33333333-3333-3333-3333-333333333333"

const nameOf = (id: string) => (id === SAM ? "Sam" : "Woody")

const match = (over: Partial<MatchResultSummary> = {}): MatchResultSummary => ({
  match_id: MATCH,
  date: "2026-07-09",
  player1_id: SAM,
  player2_id: WOODY,
  games_won_p1: 3,
  games_won_p2: 1,
  match_winner_id: SAM,
  ball_type: null,
  ...over,
})

const game = (over: Partial<GameResultInMatch> = {}): GameResultInMatch => ({
  game_id: crypto.randomUUID(),
  match_id: MATCH,
  game_number: 1,
  score_p1: 11,
  score_p2: 7,
  winner_id: SAM,
  is_undecided: false,
  ...over,
})

describe("toHistoryMatches", () => {
  it("orients a match to the profiled player when they are player1", () => {
    const [row] = toHistoryMatches(SAM, [match()], [game()], nameOf)
    expect(row).toMatchObject({
      id: MATCH,
      date: "9 Jul",
      opponent: "Woody",
      won: true,
      result: "3–1",
      games: ["11-7"],
    })
  })

  it("flips every score when the profiled player is player2", () => {
    const [row] = toHistoryMatches(WOODY, [match()], [game()], nameOf)
    expect(row).toMatchObject({
      opponent: "Sam",
      won: false,
      result: "1–3",
      games: ["7-11"],
    })
  })

  it("orders the pills by game number, not arrival order", () => {
    const games = [
      game({ game_number: 3, score_p1: 11, score_p2: 9 }),
      game({ game_number: 1, score_p1: 11, score_p2: 7 }),
      game({ game_number: 2, score_p1: 8, score_p2: 11 }),
    ]
    const [row] = toHistoryMatches(SAM, [match()], games, nameOf)
    expect(row.games).toEqual(["11-7", "8-11", "11-9"])
  })

  it("keeps an in-play match visible with no verdict", () => {
    const inPlay = match({
      match_winner_id: null,
      games_won_p1: 1,
      games_won_p2: 1,
    })
    const [row] = toHistoryMatches(SAM, [inPlay], [game()], nameOf)
    expect(row.won).toBeNull()
    expect(row.result).toBe("1–1")
  })

  it("leaves the note absent — nothing derives it yet", () => {
    const [row] = toHistoryMatches(SAM, [match()], [game()], nameOf)
    expect(row.note).toBeUndefined()
  })
})
