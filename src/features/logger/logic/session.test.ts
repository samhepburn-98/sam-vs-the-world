import { describe, expect, it } from "vitest"

import { editRally, redo, saveRally, startGame, undo } from "./session"

import type { SessionState } from "./session"
import type { RallyRow } from "@/lib/rally/rally-draft"

const SAM = "11111111-1111-4111-8111-111111111111"
const DAVE = "22222222-2222-4222-8222-222222222222"

function rally(n: number, gameId = "g1"): RallyRow {
  return {
    id: `r${n}-${gameId}`,
    game_id: gameId,
    rally_number: n,
    server_id: SAM,
    serve_side: "left",
    serve_number: 1,
    winner_id: n % 2 === 0 ? DAVE : SAM,
    end_reason: "winner",
    error_detail: null,
    forced: null,
    winning_shot: null,
  losing_shot: null,
    shot_count: 1,
  }
}

function freshState(): SessionState {
  return {
    matchId: "m1",
    games: [{ id: "g1", gameNumber: 1, rows: [] }],
    undoable: null,
    redoable: null,
  }
}

describe("session planner", () => {
  it("save → undo mid-game deletes the rally; redo re-inserts fresh id, same number", () => {
    let t = saveRally(freshState(), rally(1))
    t = saveRally(t.state, rally(2))

    t = undo(t.state)
    expect(t.writes).toEqual([{ kind: "delete_rally", row: rally(2) }])
    expect(t.state.games[0].rows).toHaveLength(1)

    t = redo(t.state, "fresh-uuid")
    expect(t.writes[0]).toMatchObject({
      kind: "insert_rally",
      row: { id: "fresh-uuid", rally_number: 2, game_id: "g1" },
    })
    expect(t.state.games[0].rows).toHaveLength(2)
    expect(t.state.redoable).toBeNull()
  })

  it("undoing a just-started game deletes the empty game row — no orphans", () => {
    let t = saveRally(freshState(), rally(1))
    t = startGame(t.state, "g2")
    expect(t.writes).toEqual([
      { kind: "insert_game", game: { id: "g2", matchId: "m1", gameNumber: 2 } },
    ])

    t = undo(t.state)
    expect(t.writes).toEqual([
      { kind: "delete_game", game: { id: "g2", matchId: "m1", gameNumber: 2 } },
    ])
    expect(t.state.games.map((g) => g.id)).toEqual(["g1"])
    // the rally in game 1 was NOT touched
    expect(t.state.games[0].rows).toHaveLength(1)
  })

  it("popping the only rally of game N>1 chains into removing the emptied game", () => {
    let t = saveRally(freshState(), rally(1))
    t = startGame(t.state, "g2")
    t = saveRally(t.state, rally(1, "g2"))

    t = undo(t.state) // pops the rally…
    expect(t.writes[0].kind).toBe("delete_rally")
    expect(t.state.undoable).toEqual({
      kind: "game",
      game: { id: "g2", matchId: "m1", gameNumber: 2 },
    })

    t = undo(t.state) // …and the next press removes the emptied game
    expect(t.writes[0].kind).toBe("delete_game")
    expect(t.state.games.map((g) => g.id)).toEqual(["g1"])
  })

  it("game 1 is never deleted — an empty game 1 is a fresh match, not an orphan", () => {
    let t = saveRally(freshState(), rally(1))
    t = undo(t.state)
    expect(t.state.games).toHaveLength(1)
    expect(t.state.undoable).toBeNull()
  })

  it("redo after un-starting a game re-creates it with a fresh id", () => {
    let t = saveRally(freshState(), rally(1))
    t = startGame(t.state, "g2")
    t = undo(t.state)
    t = redo(t.state, "g2-fresh")
    expect(t.writes).toEqual([
      {
        kind: "insert_game",
        game: { id: "g2-fresh", matchId: "m1", gameNumber: 2 },
      },
    ])
  })

  it("an edit updates in place and invalidates undo/redo", () => {
    let t = saveRally(freshState(), rally(1))
    const edited = { ...rally(1), end_reason: "stroke" as const }
    t = editRally(t.state, edited)
    expect(t.writes).toEqual([{ kind: "update_rally", row: edited }])
    expect(t.state.games[0].rows[0].end_reason).toBe("stroke")
    expect(t.state.undoable).toBeNull()
    expect(t.state.redoable).toBeNull()
  })

  it("undo/redo with nothing to do are no-ops with no writes", () => {
    const t = undo(freshState())
    expect(t.writes).toEqual([])
    expect(redo(t.state, "x").writes).toEqual([])
  })
})
