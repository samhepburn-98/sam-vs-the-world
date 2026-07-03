import { z } from "zod"

import { endReason, errorDetail, serveSide, shotType } from "./enums"

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
    }),
  }),
})

export type RallyDbRowWithGame = z.infer<typeof rallyDbRowWithGame>
