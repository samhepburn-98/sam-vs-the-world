import type { RallyRow } from "@/lib/rally/rally-draft"

// The write contract shared by the logger's session planner (which produces
// intents) and the data-access layer (which executes them). It lives here,
// not in the planner, so lib/api can depend on it without reaching into a
// feature.

export interface GameRef {
  id: string
  matchId: string
  gameNumber: number
}

export type WriteIntent =
  | { kind: "insert_rally"; row: RallyRow }
  | { kind: "update_rally"; row: RallyRow }
  | { kind: "delete_rally"; row: RallyRow }
  | { kind: "insert_game"; game: GameRef }
  | { kind: "delete_game"; game: GameRef }
