import type { FoldedGame } from "@/features/dashboard/lib/fold-match"
import type { RallyScored } from "@/lib/schemas/rally"

// The match page's head-to-head numbers (§5.2), derived client-side from the
// folded rallies_scored rows already on hand — the same derive-don't-store
// rule as the DB views, so an edited rally recomputes everything on refetch.

export interface PairCount {
  p1: number
  p2: number
}

export interface MatchStats {
  /** every logged rally, lets included */
  rallies: number
  winners: PairCount
  /** errors + serve faults, attributed to the error-maker (the non-winner) */
  errors: PairCount
  /** untouched serves: a winner off your own serve in one shot (§derive-aces) */
  aces: PairCount
  /** points won on your own serve / your serves that decided a point */
  serveWon: PairCount
  serveTotal: PairCount
}

const zero = (): PairCount => ({ p1: 0, p2: 0 })

export function computeMatchStats(
  rows: Array<RallyScored>,
  p1Id: string,
): MatchStats {
  const stats: MatchStats = {
    rallies: rows.length,
    winners: zero(),
    errors: zero(),
    aces: zero(),
    serveWon: zero(),
    serveTotal: zero(),
  }

  for (const r of rows) {
    if (r.winner_id === null) continue // lets decide nothing
    const winner: keyof PairCount = r.winner_id === p1Id ? "p1" : "p2"
    const loser: keyof PairCount = winner === "p1" ? "p2" : "p1"
    const server: keyof PairCount = r.server_id === p1Id ? "p1" : "p2"

    // "ace" is the pre-derivation enum value — count it as the winner it now is
    const isWinner = r.end_reason === "winner" || r.end_reason === "ace"
    if (isWinner) stats.winners[winner] += 1
    if (
      r.end_reason === "ace" ||
      (isWinner && r.shot_count === 1 && r.winner_id === r.server_id)
    )
      stats.aces[winner] += 1
    if (r.end_reason === "error" || r.end_reason === "serve_fault")
      stats.errors[loser] += 1

    stats.serveTotal[server] += 1
    if (winner === server) stats.serveWon[server] += 1
  }

  return stats
}

// The momentum worm's data (§4.5, match-wide): every game's lead over its
// rallies laid out on one continuous axis. Games are independent races, so
// each starts from a synthetic level point and a null gap breaks the line
// between them (recharts leaves nulls unconnected).

export interface MatchLeadPoint {
  x: number
  /** p1's lead after this rally; null = the gap between two games */
  lead: number | null
  gameNumber: number
  /** rally number within the game; 0 for the synthetic game-start point */
  rally: number
}

export interface MatchLeadSeries {
  points: Array<MatchLeadPoint>
  /** x positions of the dividers between games */
  boundaries: Array<number>
  /** one tick per game, at its midpoint */
  ticks: Array<{ x: number; gameNumber: number }>
}

export function buildMatchLeadSeries(
  games: Array<FoldedGame>,
): MatchLeadSeries {
  const points: Array<MatchLeadPoint> = []
  const boundaries: Array<number> = []
  const ticks: Array<{ x: number; gameNumber: number }> = []
  let x = 0

  for (const [i, game] of games.entries()) {
    if (i > 0) {
      boundaries.push(x)
      points.push({ x, lead: null, gameNumber: game.gameNumber, rally: 0 })
      x += 1
    }
    const start = x
    points.push({ x, lead: 0, gameNumber: game.gameNumber, rally: 0 })
    x += 1
    for (const r of game.rows) {
      points.push({
        x,
        lead: r.score_p1 - r.score_p2,
        gameNumber: game.gameNumber,
        rally: r.rally_number,
      })
      x += 1
    }
    ticks.push({
      x: (start + x - 1) / 2,
      gameNumber: game.gameNumber,
    })
  }

  return { points, boundaries, ticks }
}
