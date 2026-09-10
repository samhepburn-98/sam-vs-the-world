import { describe, expect, it } from "vitest"

import { foldMatchToScored, gameScores, toRallyRow } from "./fold-match"

import type { MatchDetail } from "@/lib/schemas/match"
import type { RallyScored, RallySummary } from "@/lib/schemas/rally"

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
    winning_shot: null,
    losing_shot: null,
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

describe("toRallyRow", () => {
  const scored = {
    id: "r1",
    game_id: "g1",
    rally_number: 4,
    server_id: "sam",
    serve_side: "left",
    serve_number: 2,
    winner_id: "alex",
    end_reason: "error",
    error_detail: "tin",
    forced: false,
    winning_shot: null,
    losing_shot: "drive",
    shot_count: 6,
  } as unknown as RallyScored

  it("keeps the fields the timeline and editor read", () => {
    expect(toRallyRow(scored)).toEqual({
      id: "r1",
      game_id: "g1",
      rally_number: 4,
      server_id: "sam",
      serve_side: "left",
      serve_number: 2,
      winner_id: "alex",
      end_reason: "error",
      error_detail: "tin",
      forced: false,
      winning_shot: null,
      losing_shot: "drive",
      shot_count: 6,
    })
  })

  it("narrows serve_number to 1 or 2 — anything not 2 is a first serve", () => {
    expect(toRallyRow({ ...scored, serve_number: 1 }).serve_number).toBe(1)
    expect(toRallyRow({ ...scored, serve_number: 2 }).serve_number).toBe(2)
  })

  it("carries a let through with its null winner", () => {
    const paused = {
      ...scored,
      winner_id: null,
      end_reason: "let",
    } as RallyScored
    expect(toRallyRow(paused).winner_id).toBeNull()
    expect(toRallyRow(paused).end_reason).toBe("let")
  })
})

describe("gameScores", () => {
  const folded = foldMatchToScored(match)

  it("reads the final score off the last rally of each game", () => {
    const scored = gameScores(folded, P1, P2)
    expect(scored[0].scoreP1).toBe(folded[0].rows.at(-1)?.score_p1)
    expect(scored[0].scoreP2).toBe(folded[0].rows.at(-1)?.score_p2)
  })

  it("gives the game to whoever led at the last rally played", () => {
    const [g] = gameScores(folded, P1, P2)
    const expected =
      g.scoreP1 > g.scoreP2 ? P1 : g.scoreP2 > g.scoreP1 ? P2 : null
    expect(g.winner).toBe(expected)
  })

  // a level game is undecided, not a draw to render — the match header takes
  // its verdict from match_results, which owns the clinch and draw rules
  it("returns a null winner when the game finished level", () => {
    const level = [{ ...folded[0], rows: [] }]
    expect(gameScores(level, P1, P2)[0].winner).toBeNull()
  })

  it("scores an empty game 0-0 rather than throwing", () => {
    const empty = [{ ...folded[0], rows: [] }]
    const [g] = gameScores(empty, P1, P2)
    expect([g.scoreP1, g.scoreP2]).toEqual([0, 0])
  })

  it("keeps the folded game's own fields", () => {
    const [g] = gameScores(folded, P1, P2)
    expect(g.gameId).toBe(folded[0].gameId)
    expect(g.gameNumber).toBe(folded[0].gameNumber)
    expect(g.rows).toBe(folded[0].rows)
  })
})
