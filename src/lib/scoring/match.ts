import type { GameResult } from "./types"
import type { MatchOutcome } from "@/lib/schemas/match"

// Mirrors match_results: only decided games count; best-of clinches at
// floor(format/2)+1; casual (null format) is a simple majority; null = no
// winner (tie or nobody clinched).

export interface MatchTally {
  gamesWonP1: number
  gamesWonP2: number
  matchWinnerId: string | null
}

export function tallyMatch(
  games: ReadonlyArray<GameResult>,
  ctx: { player1Id: string; player2Id: string; format: number | null }
): MatchTally {
  let gamesWonP1 = 0
  let gamesWonP2 = 0
  for (const g of games) {
    if (g.winnerId === ctx.player1Id) gamesWonP1++
    else if (g.winnerId === ctx.player2Id) gamesWonP2++
  }

  let matchWinnerId: string | null = null
  if (ctx.format !== null) {
    const needed = Math.floor(ctx.format / 2) + 1
    if (gamesWonP1 >= needed) matchWinnerId = ctx.player1Id
    else if (gamesWonP2 >= needed) matchWinnerId = ctx.player2Id
  } else if (gamesWonP1 > gamesWonP2) {
    matchWinnerId = ctx.player1Id
  } else if (gamesWonP2 > gamesWonP1) {
    matchWinnerId = ctx.player2Id
  }

  return { gamesWonP1, gamesWonP2, matchWinnerId }
}

/** The view's outcome column, mirrored for the logger's live tally (parity
 *  is pinned by the same golden fixtures as tallyMatch): a best-of clinches
 *  or stays pending; a casual session goes to the majority, stands as a draw
 *  once level with anything decided, and is pending before that. */
export function deriveOutcome(
  gamesWonP1: number,
  gamesWonP2: number,
  format: number | null
): MatchOutcome {
  if (format !== null) {
    const needed = Math.floor(format / 2) + 1
    if (gamesWonP1 >= needed) return "p1"
    if (gamesWonP2 >= needed) return "p2"
    return "pending"
  }
  if (gamesWonP1 > gamesWonP2) return "p1"
  if (gamesWonP2 > gamesWonP1) return "p2"
  return gamesWonP1 + gamesWonP2 > 0 ? "draw" : "pending"
}

/** The backend's neutral outcome, seen from one side of the net. */
export type PlayerOutcome = "won" | "lost" | "drawn" | "pending"

export function orientOutcome(
  outcome: MatchOutcome,
  isP1: boolean
): PlayerOutcome {
  if (outcome === "p1") return isP1 ? "won" : "lost"
  if (outcome === "p2") return isP1 ? "lost" : "won"
  return outcome === "draw" ? "drawn" : "pending"
}

/** The letter a W/L/D chip wears, from one side of the net.
 *
 *  Pending returns null rather than a letter: a match still being logged has
 *  no verdict, and each surface says something different in its place — the
 *  home form strip drops it, the head-to-head list prints "In play". Making
 *  that a null forces the caller to decide instead of quietly picking one.
 *
 *  Note this answers a different question from a game's nullable `won`, where
 *  null means the game ended level. There the surface chooses: a form strip
 *  drops a tied game (it is not a result), a results list shows it as a draw.
 */
export type OutcomeChip = "w" | "l" | "d"

export function outcomeChip(
  outcome: MatchOutcome,
  isP1: boolean
): OutcomeChip | null {
  const oriented = orientOutcome(outcome, isP1)
  if (oriented === "won") return "w"
  if (oriented === "lost") return "l"
  if (oriented === "drawn") return "d"
  return null
}
