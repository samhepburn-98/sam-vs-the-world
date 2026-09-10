import { describe, expect, it } from "vitest"

import { deriveGameView } from "./game-view"

import type { SessionState } from "./session"
import type { RallyRow } from "@/lib/rally/rally-draft"
import type { MatchDetail } from "@/lib/schemas/match"

const P1 = "11111111-1111-1111-1111-111111111111"
const P2 = "22222222-2222-2222-2222-222222222222"

function match(over: Partial<MatchDetail> = {}): MatchDetail {
  return {
    id: "m1",
    player1_id: P1,
    player2_id: P2,
    target_score: 11,
    tiebreak: "win_by_2",
    serves_per_point: 2,
    let_resets_serve: false,
    format: null,
    ...over,
  } as MatchDetail
}

let n = 0
function rally(winner: string, server: string): RallyRow {
  n += 1
  return {
    id: `r${n}`,
    game_id: "g",
    rally_number: n,
    server_id: server,
    serve_side: "right",
    serve_number: 1,
    winner_id: winner,
    end_reason: "winner",
    error_detail: null,
    forced: null,
    winning_shot: null,
    losing_shot: null,
    shot_count: 2,
  }
}

function session(
  games: Array<{ gameNumber: number; rows: Array<RallyRow> }>
): SessionState {
  return {
    matchId: "m1",
    games: games.map((g, i) => ({ id: `g${i + 1}`, ...g })),
    undoable: null,
    redoable: null,
  }
}

describe("deriveGameView — who serves first", () => {
  // decision 4: server_id is a stored fact, never derived. Real serving can
  // deviate from the rules, so a logged rally 1 outranks every suggestion.
  it("takes the stored server of rally 1 over the setup choice", () => {
    const s = session([{ gameNumber: 1, rows: [rally(P1, P2)] }])
    const view = deriveGameView(s, match(), P1)
    expect(view.gameCtx.firstServerId).toBe(P2)
  })

  it("falls back to the setup choice when game 1 has no rally yet", () => {
    const s = session([{ gameNumber: 1, rows: [] }])
    expect(deriveGameView(s, match(), P2).gameCtx.firstServerId).toBe(P2)
  })

  it("falls back to player one when there is no setup choice either", () => {
    const s = session([{ gameNumber: 1, rows: [] }])
    expect(deriveGameView(s, match()).gameCtx.firstServerId).toBe(P1)
  })

  // §7.2: each later game defaults to the previous game's winner
  it("hands a fresh game 2 to whoever won game 1", () => {
    const g1 = Array.from({ length: 11 }, () => rally(P2, P2))
    const s = session([
      { gameNumber: 1, rows: g1 },
      { gameNumber: 2, rows: [] },
    ])
    expect(deriveGameView(s, match(), P1).gameCtx.firstServerId).toBe(P2)
  })
})

describe("deriveGameView — score and standing", () => {
  it("scores the live game and leaves earlier games as priors", () => {
    const s = session([
      { gameNumber: 1, rows: Array.from({ length: 11 }, () => rally(P1, P1)) },
      { gameNumber: 2, rows: [rally(P2, P1), rally(P2, P2)] },
    ])
    const view = deriveGameView(s, match(), P1)
    expect(view.game.gameNumber).toBe(2)
    expect(view.priorGames).toHaveLength(1)
    expect(view.score).toEqual({ p1: 0, p2: 2 })
    expect(view.tally.gamesWonP1).toBe(1)
  })

  // game-over is a suggestion for the banner, never a gate (§7.7 tier 3)
  it("reports the game over once the target is reached by two", () => {
    const rows = Array.from({ length: 11 }, () => rally(P1, P1))
    const s = session([{ gameNumber: 1, rows }])
    const view = deriveGameView(s, match(), P1)
    expect(view.over).toEqual({ over: true, leader: "p1" })
  })

  it("does not call it over at 10-all under win-by-2", () => {
    const rows = [
      ...Array.from({ length: 10 }, () => rally(P1, P1)),
      ...Array.from({ length: 10 }, () => rally(P2, P2)),
    ]
    const s = session([{ gameNumber: 1, rows }])
    expect(deriveGameView(s, match(), P1).over).toEqual({ over: false })
  })

  it("carries the match's house rules through to both contexts", () => {
    const s = session([{ gameNumber: 1, rows: [] }])
    const view = deriveGameView(s, match({ target_score: 15 }), P1)
    expect(view.rules.targetScore).toBe(15)
    expect(view.gameCtx.rules.targetScore).toBe(15)
    expect(view.draftCtx.rules.targetScore).toBe(15)
  })
})
