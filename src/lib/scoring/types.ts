// The logger's live scoring engine (§8.4 sole exception): pure TS mirrors of
// the SQL derivation semantics, pinned to them by the shared golden fixtures.
// Deliberately independent of the DB types — player identity is just strings.

export type ServeSide = "left" | "right"

export type EndReason =
  "winner" | "error" | "stroke" | "let" | "ace" | "serve_fault"

export interface HouseRules {
  targetScore: number
  tiebreak: "win_by_2" | "sudden_death"
  servesPerPoint: 1 | 2
  letResetsServe: boolean
}

/** Sam's rules — the setup form's defaults (§7.7). */
export const DEFAULT_HOUSE_RULES: HouseRules = {
  targetScore: 11,
  tiebreak: "win_by_2",
  servesPerPoint: 2,
  letResetsServe: false,
}

export interface RallyInput {
  serverId: string
  serveSide: ServeSide
  serveNumber: 1 | 2
  /** null = let (no winner, no score change) */
  winnerId: string | null
  endReason: EndReason
}

export interface GameContext {
  player1Id: string
  player2Id: string
  /** who serves the game's first rally (asked, never assumed — §7.2) */
  firstServerId: string
  rules: HouseRules
}

/** Score aligned to the match's player1/player2, like the views' score_p1/p2. */
export interface Score {
  p1: number
  p2: number
}

export interface GameResult {
  score: Score
  /** null when tied (mirrors game_results.winner_id) */
  winnerId: string | null
  /** true when the last rally left the game tied (mirrors is_undecided) */
  undecided: boolean
}

export interface Suggestion {
  serverId: string
  serveSide: ServeSide
  serveNumber: 1 | 2
}
