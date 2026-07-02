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
