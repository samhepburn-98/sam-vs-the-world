import { describe, expect, it } from "vitest"

import { buildMatchLeadSeries, computeMatchStats } from "./match-stats"

import type { FoldedGame } from "@/features/dashboard/lib/fold-match"
import type { RallyScored } from "@/lib/schemas/rally"

const P1 = "11111111-1111-1111-1111-111111111111"
const P2 = "22222222-2222-2222-2222-222222222222"

function rally(over: Partial<RallyScored>): RallyScored {
  return {
    rally_number: 1,
    player1_id: P1,
    player2_id: P2,
    server_id: P1,
    winner_id: P1,
    end_reason: "winner",
    shot_count: 3,
    score_p1: 0,
    score_p2: 0,
    ...over,
  } as RallyScored
}

describe("computeMatchStats", () => {
  it("attributes winners, errors, and aces to the right side", () => {
    const rows = [
      // a rally-ending winner by P1
      rally({ end_reason: "winner", winner_id: P1, shot_count: 5 }),
      // an untouched serve: P1's winner off their own serve in one shot
      rally({ end_reason: "winner", winner_id: P1, server_id: P1, shot_count: 1 }),
      // one shot but NOT off their own serve — a winner, not an ace
      rally({ end_reason: "winner", winner_id: P1, server_id: P2, shot_count: 1 }),
      // P2 errors: the point goes to P1, the error belongs to P2
      rally({ end_reason: "error", winner_id: P1 }),
      // P1 serve-faults: point to P2, error to P1
      rally({ end_reason: "serve_fault", winner_id: P2, server_id: P1 }),
      // a stroke is a conceded point — neither a winner nor an error
      rally({ end_reason: "stroke", winner_id: P2 }),
      // a let decides nothing but still counts as a logged rally
      rally({ end_reason: "let", winner_id: null }),
    ]
    const s = computeMatchStats(rows, P1)
    expect(s.rallies).toBe(7)
    expect(s.winners).toEqual({ p1: 3, p2: 0 })
    expect(s.aces).toEqual({ p1: 1, p2: 0 })
    expect(s.errors).toEqual({ p1: 1, p2: 1 })
  })

  it("counts a legacy explicit ace as both winner and ace", () => {
    const s = computeMatchStats(
      [rally({ end_reason: "ace", winner_id: P2, server_id: P2, shot_count: null })],
      P1,
    )
    expect(s.winners).toEqual({ p1: 0, p2: 1 })
    expect(s.aces).toEqual({ p1: 0, p2: 1 })
  })

  it("tracks points won on own serve, excluding lets", () => {
    const rows = [
      rally({ server_id: P1, winner_id: P1 }),
      rally({ server_id: P1, winner_id: P2, end_reason: "error" }),
      rally({ server_id: P2, winner_id: P2 }),
      rally({ server_id: P1, winner_id: null, end_reason: "let" }),
    ]
    const s = computeMatchStats(rows, P1)
    expect(s.serveTotal).toEqual({ p1: 2, p2: 1 })
    expect(s.serveWon).toEqual({ p1: 1, p2: 1 })
  })
})

describe("buildMatchLeadSeries", () => {
  const game = (
    gameNumber: number,
    leads: Array<[p1: number, p2: number]>,
  ): FoldedGame => ({
    gameId: `g${gameNumber}`,
    gameNumber,
    rows: leads.map(([p1, p2], i) =>
      rally({ rally_number: i + 1, score_p1: p1, score_p2: p2 }),
    ),
  })

  it("lays games on one axis with a level start and a null gap between", () => {
    const series = buildMatchLeadSeries([
      game(1, [[1, 0], [1, 1]]),
      game(2, [[0, 1]]),
    ])
    expect(series.points.map((p) => p.lead)).toEqual([
      0, 1, 0, // game 1 from level
      null, // the gap — recharts breaks the line here
      0, -1, // game 2 restarts from level
    ])
    expect(series.points.map((p) => p.x)).toEqual([0, 1, 2, 3, 4, 5])
    expect(series.boundaries).toEqual([3])
    expect(series.ticks).toEqual([
      { x: 1, label: "Game 1" },
      { x: 4.5, label: "Game 2" },
    ])
  })

  it("marks synthetic points with rally 0 so tooltips can skip them", () => {
    const series = buildMatchLeadSeries([game(1, [[1, 0]])])
    expect(series.points.map((p) => p.rally)).toEqual([0, 1])
  })
})
