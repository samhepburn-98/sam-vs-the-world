import { z } from "zod"

import { ballType, endReason, errorDetail, serveSide, shotType } from "./enums"

/** A raw rally row as stored (summary level — §8.4 naming). */
export const rallySummary = z.object({
  id: z.string().uuid(),
  game_id: z.string().uuid(),
  rally_number: z.number().int(),
  server_id: z.string().uuid(),
  serve_side: serveSide,
  serve_number: z.number().int(),
  winner_id: z.string().uuid().nullable(),
  end_reason: endReason,
  error_detail: errorDetail.nullable(),
  forced: z.boolean().nullable(),
  shot_type: shotType.nullable(),
  shot_count: z.number().int().nullable(),
})

export type RallySummary = z.infer<typeof rallySummary>

/** Every stored column — the /manage raw browser's row (§5.4). */
export const rallyDbRow = rallySummary.extend({
  created_at: z.string(),
  updated_at: z.string(),
})

export type RallyDbRow = z.infer<typeof rallyDbRow>

/** Browser row with the parent game (and its match) embedded — the
 *  human-readable label ("G2 · Sam vs Dave") instead of a uuid (§5.4). */
export const rallyDbRowWithGame = rallyDbRow.extend({
  games: z.object({
    game_number: z.number().int(),
    matches: z.object({
      date: z.string(),
      player1_id: z.string().uuid(),
      player2_id: z.string().uuid(),
      // the rally editor needs the match's rules (§7.7)
      target_score: z.number().int(),
      tiebreak: z.enum(["win_by_2", "sudden_death"]),
      serves_per_point: z.number().int(),
      let_resets_serve: z.boolean(),
    }),
  }),
})

export type RallyDbRowWithGame = z.infer<typeof rallyDbRowWithGame>

/** A `rallies_scored` view row — the stored rally plus its derived running
 *  score and match context. What every `*_rallies` drill-through companion
 *  RPC returns (§8.4). */
export const rallyScored = rallySummary.extend({
  match_id: z.string().uuid(),
  game_number: z.number().int(),
  date: z.string(),
  ball_type: ballType.nullable(),
  player1_id: z.string().uuid(),
  player2_id: z.string().uuid(),
  receiver_id: z.string().uuid(),
  is_let: z.boolean(),
  score_p1: z.number().int(),
  score_p2: z.number().int(),
})

export type RallyScored = z.infer<typeof rallyScored>
