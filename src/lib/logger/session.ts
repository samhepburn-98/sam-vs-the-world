import type { RallyRow } from "@/lib/logger/rally-draft"

// The logging session planner (§5.3, §8.7 #3): every state change — rally
// saved, rally edited, undo, redo, next game started — is a pure transition
// returning the next session state plus the write intents it implies. The
// shell maps intents onto queue ops; nothing here touches Supabase or React.
//
// Undo is one action deep and reverses the LAST ACTION, not just the last
// rally: undoing a just-started game deletes the still-empty game row, so an
// orphan game row is unrepresentable. When popping a rally empties game N>1,
// the chain continues — the next undo removes the emptied game. Redo
// re-inserts a FRESH row (new client id, same rally_number): the delete may
// or may not have landed yet, and a fresh id keeps both orders idempotent.

export interface GameState {
  id: string
  gameNumber: number
  rows: Array<RallyRow>
}

export interface GameRef {
  id: string
  matchId: string
  gameNumber: number
}

export type UndoEntry =
  | { kind: "rally"; row: RallyRow }
  | { kind: "game"; game: GameRef }

export interface SessionState {
  matchId: string
  games: Array<GameState>
  undoable: UndoEntry | null
  redoable: UndoEntry | null
}

export type WriteIntent =
  | { kind: "insert_rally"; row: RallyRow }
  | { kind: "update_rally"; row: RallyRow }
  | { kind: "delete_rally"; row: RallyRow }
  | { kind: "insert_game"; game: GameRef }
  | { kind: "delete_game"; game: GameRef }

export interface Transition {
  state: SessionState
  writes: Array<WriteIntent>
}

export function currentGame(state: SessionState): GameState {
  const game = state.games.at(-1)
  if (!game) throw new Error("session has no games")
  return game
}

function replaceLastGame(
  state: SessionState,
  game: GameState,
): Array<GameState> {
  return [...state.games.slice(0, -1), game]
}

export function saveRally(state: SessionState, row: RallyRow): Transition {
  const game = currentGame(state)
  return {
    state: {
      ...state,
      games: replaceLastGame(state, { ...game, rows: [...game.rows, row] }),
      undoable: { kind: "rally", row },
      redoable: null,
    },
    writes: [{ kind: "insert_rally", row }],
  }
}

/** an edit invalidates the undo/redo pair — the timeline is the editing tool */
export function editRally(state: SessionState, row: RallyRow): Transition {
  return {
    state: {
      ...state,
      games: state.games.map((g) =>
        g.id === row.game_id
          ? { ...g, rows: g.rows.map((r) => (r.id === row.id ? row : r)) }
          : g,
      ),
      undoable: null,
      redoable: null,
    },
    writes: [{ kind: "update_rally", row }],
  }
}

export function startGame(state: SessionState, gameId: string): Transition {
  const gameNumber = currentGame(state).gameNumber + 1
  const game: GameRef = { id: gameId, matchId: state.matchId, gameNumber }
  return {
    state: {
      ...state,
      games: [...state.games, { id: gameId, gameNumber, rows: [] }],
      undoable: { kind: "game", game },
      redoable: null,
    },
    writes: [{ kind: "insert_game", game }],
  }
}

export function undo(state: SessionState): Transition {
  if (!state.undoable) return { state, writes: [] }

  if (state.undoable.kind === "game") {
    // un-start the just-started game — it is empty by construction, so
    // deleting the row leaves nothing orphaned
    const { game } = state.undoable
    return {
      state: {
        ...state,
        games: state.games.filter((g) => g.id !== game.id),
        undoable: null,
        redoable: { kind: "game", game },
      },
      writes: [{ kind: "delete_game", game }],
    }
  }

  const { row } = state.undoable
  const game = currentGame(state)
  const remaining = game.rows.filter((r) => r.id !== row.id)
  // popping the only rally of game N>1 empties it — chain the undo so the
  // next press removes the emptied game row
  const chained: UndoEntry | null =
    remaining.length === 0 && game.gameNumber > 1
      ? {
          kind: "game",
          game: {
            id: game.id,
            matchId: state.matchId,
            gameNumber: game.gameNumber,
          },
        }
      : null
  return {
    state: {
      ...state,
      games: replaceLastGame(state, { ...game, rows: remaining }),
      undoable: chained,
      redoable: { kind: "rally", row },
    },
    writes: [{ kind: "delete_rally", row }],
  }
}

export function redo(state: SessionState, freshId: string): Transition {
  if (!state.redoable) return { state, writes: [] }

  if (state.redoable.kind === "game") {
    const game: GameRef = { ...state.redoable.game, id: freshId }
    return {
      state: {
        ...state,
        games: [
          ...state.games,
          { id: freshId, gameNumber: game.gameNumber, rows: [] },
        ],
        undoable: { kind: "game", game },
        redoable: null,
      },
      writes: [{ kind: "insert_game", game }],
    }
  }

  const game = currentGame(state)
  const row: RallyRow = {
    ...state.redoable.row,
    id: freshId,
    game_id: game.id,
  }
  return {
    state: {
      ...state,
      games: replaceLastGame(state, { ...game, rows: [...game.rows, row] }),
      undoable: { kind: "rally", row },
      redoable: null,
    },
    writes: [{ kind: "insert_rally", row }],
  }
}
