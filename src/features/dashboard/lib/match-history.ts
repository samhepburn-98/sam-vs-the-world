import type { BallType } from "@/lib/schemas/enums"
import type { GameResultInMatch } from "@/lib/schemas/game"
import type { MatchResultSummary } from "@/lib/schemas/match"

// One row of the profile's match history, oriented to the profiled player:
// their games first in every score, W/L from their side of the net. Assembled
// pure from the two views the API fetches, so the shape is testable without
// a client.

export interface HistoryMatch {
  /** stable row key — the match id */
  id: string
  date: string
  opponent: string
  /** null while the match is still in play */
  won: boolean | null
  result: string
  /** the ball the match was played with, or null when it wasn't recorded */
  ball: BallType | null
  /** Per-game scores, this player first (e.g. "11-7") — the table derives
   *  each pill's won/lost styling from the two numbers. */
  games: Array<string>
  /** the night's one remembered moment — absent until derived notes land */
  note?: string
}

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")

/** "2026-07-09" → "9 Jul" — the season reads in days and months. */
function formatDate(iso: string) {
  const [, m, d] = iso.split("-").map(Number)
  return `${d} ${MONTHS[m - 1]}`
}

export function toHistoryMatches(
  playerId: string,
  matches: Array<MatchResultSummary>,
  games: Array<GameResultInMatch>,
  nameOf: (id: string) => string,
): Array<HistoryMatch> {
  return matches.map((m) => {
    const isP1 = m.player1_id === playerId
    const mine = (isP1 ? m.games_won_p1 : m.games_won_p2) ?? 0
    const theirs = (isP1 ? m.games_won_p2 : m.games_won_p1) ?? 0
    const pills = games
      .filter((g) => g.match_id === m.match_id)
      .sort((a, b) => a.game_number - b.game_number)
      .map((g) =>
        isP1
          ? `${g.score_p1}-${g.score_p2}`
          : `${g.score_p2}-${g.score_p1}`,
      )
    return {
      id: m.match_id,
      date: formatDate(m.date),
      opponent: nameOf(isP1 ? m.player2_id : m.player1_id),
      won: m.match_winner_id === null ? null : m.match_winner_id === playerId,
      result: `${mine}–${theirs}`,
      ball: m.ball_type,
      games: pills,
      // note stays absent — nothing derives it yet
    }
  })
}
