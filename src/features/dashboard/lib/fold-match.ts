import type { RallyRow } from "@/lib/rally/rally-draft"
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

/** A scored rally narrowed to the row shape the timeline and rally editor
 *  read. `serve_number` widens to `1 | 2` on the way: the column is a
 *  smallint the DB constrains, but the generated type is a plain number. */
export function toRallyRow(r: RallyScored): RallyRow {
  return {
    id: r.id,
    game_id: r.game_id,
    rally_number: r.rally_number,
    server_id: r.server_id,
    serve_side: r.serve_side,
    serve_number: r.serve_number === 2 ? 2 : 1,
    winner_id: r.winner_id,
    end_reason: r.end_reason,
    error_detail: r.error_detail,
    forced: r.forced,
    winning_shot: r.winning_shot,
    losing_shot: r.losing_shot,
    shot_count: r.shot_count,
  }
}
