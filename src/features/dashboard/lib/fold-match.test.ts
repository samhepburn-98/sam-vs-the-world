import { describe, expect, it } from "vitest"

import { foldMatchToScored } from "./fold-match"

import type { MatchDetail } from "@/lib/schemas/match"
import type { RallySummary } from "@/lib/schemas/rally"

const P1 = "11111111-1111-1111-1111-111111111111"
const P2 = "22222222-2222-2222-2222-222222222222"

function rally(n: number, winner: string | null): RallySummary {
  return {
    id: `r${n}`,
    game_id: "g1",
    rally_number: n,
    server_id: P1,
    serve_side: "left",
    serve_number: 1,
    winner_id: winner,
    end_reason: winner === null ? "let" : "winner",
    error_detail: null,
    forced: null,
    shot_type: null,
    shot_count: null,
  }
}

const match = {
  id: "m1",
  date: "2026-06-01",
  player1_id: P1,
  player2_id: P2,
  ball_type: "blue",
  games: [
    {
      id: "g1",
      game_number: 1,
      rallies: [
        rally(1, P1), // 1–0
        rally(2, null), // let — holds 1–0
        rally(3, P2), // 1–1
        rally(4, P1), // 2–1
      ],
    },
  ],
} as MatchDetail

describe("foldMatchToScored", () => {
  it("carries the running score, with a let scoring nothing", () => {
    const [game] = foldMatchToScored(match)
    expect(game.rows.map((r) => [r.score_p1, r.score_p2])).toEqual([
      [1, 0],
      [1, 0], // the let holds the prior score
      [1, 1],
      [2, 1],
    ])
  })

  it("derives context: receiver, is_let, and match fields", () => {
    const [game] = foldMatchToScored(match)
    expect(game.rows[0]).toMatchObject({
      match_id: "m1",
      game_number: 1,
      receiver_id: P2, // server is P1
      is_let: false,
    })
    expect(game.rows[1].is_let).toBe(true)
  })
})
