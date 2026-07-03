import type { MatchDetail } from "@/lib/schemas/match"
import type { RallyScored } from "@/lib/schemas/rally"

// Match detail folds its own rallies into the `rallies_scored` shape client-
// side (§8.4 exception): the running score and derived context come from the
// same rule as the DB view — a let scores nothing, so its row carries the
// prior score — so the timeline, momentum strip, and rally sheet all read one
// consistent structure without a round-trip.

export interface FoldedGame {
  gameId: string
  gameNumber: number
  rows: Array<RallyScored>
}

export function foldMatchToScored(match: MatchDetail): Array<FoldedGame> {
  return match.games.map((game) => {
    let p1 = 0
    let p2 = 0
    const rows = game.rallies.map((r): RallyScored => {
      if (r.winner_id === match.player1_id) p1 += 1
      else if (r.winner_id === match.player2_id) p2 += 1
      return {
        ...r,
        match_id: match.id,
        game_number: game.game_number,
        date: match.date,
        ball_type: match.ball_type,
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        receiver_id:
          r.server_id === match.player1_id
            ? match.player2_id
            : match.player1_id,
        is_let: r.end_reason === "let",
        score_p1: p1,
        score_p2: p2,
      }
    })
    return { gameId: game.id, gameNumber: game.game_number, rows }
  })
}
