import type { HouseRules, Score } from "./types"

// Game-over is a SUGGESTION (the logger's banner), never a gate — casual play
// can continue past the target, and the derivation doesn't care (§7.7 tier 3).

export type GameOver = { over: false } | { over: true; leader: "p1" | "p2" }

export function gameOver(score: Score, rules: HouseRules): GameOver {
  const leader = score.p1 > score.p2 ? "p1" : score.p2 > score.p1 ? "p2" : null
  if (!leader) return { over: false }

  const high = Math.max(score.p1, score.p2)
  const margin = Math.abs(score.p1 - score.p2)
  const requiredMargin = rules.tiebreak === "win_by_2" ? 2 : 1

  if (high >= rules.targetScore && margin >= requiredMargin) {
    return { over: true, leader }
  }
  return { over: false }
}
