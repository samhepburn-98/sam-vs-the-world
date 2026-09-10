import type { RallyRow } from "@/lib/rally/rally-draft"
import type { MatchDetail } from "@/lib/schemas/match"
import type { HouseRules } from "@/lib/scoring"

// Turning the fetched match into the shapes the logger works in. Both of
// these exist because the generated database types are wider than the
// columns really are: smallints arrive as `number`, so the narrowing has to
// happen once, on the way in, rather than at every use.

/** A rally row from the API, narrowed to the shape the draft engine reads.
 *  `serve_number` is a smallint the DB constrains to 1 or 2; anything that
 *  is not 2 is a first serve. */
export function toSessionRow(rally: {
  id: string
  game_id: string
  rally_number: number
  server_id: string
  serve_side: "left" | "right"
  serve_number: number
  winner_id: string | null
  end_reason: RallyRow["end_reason"]
  error_detail: RallyRow["error_detail"]
  forced: boolean | null
  winning_shot: RallyRow["winning_shot"]
  losing_shot: RallyRow["losing_shot"]
  shot_count: number | null
}): RallyRow {
  return { ...rally, serve_number: rally.serve_number === 2 ? 2 : 1 }
}

/** The match's house rules (§7.7), narrowed for the scoring engine. */
export function houseRulesOf(match: MatchDetail): HouseRules {
  return {
    targetScore: match.target_score,
    tiebreak: match.tiebreak,
    servesPerPoint: match.serves_per_point === 1 ? 1 : 2,
    letResetsServe: match.let_resets_serve,
  }
}
