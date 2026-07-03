import { z } from "zod"

/** Every stored column — the /manage raw browser's row (§5.4). */
export const gameRow = z.object({
  id: z.string().uuid(),
  match_id: z.string().uuid(),
  game_number: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type GameRow = z.infer<typeof gameRow>

/** Browser row with the parent match embedded — the human-readable label
 *  ("Sam vs Dave · 2026-07-03") instead of a uuid fragment (§5.4). */
export const gameRowWithMatch = gameRow.extend({
  matches: z.object({
    date: z.string(),
    player1_id: z.string().uuid(),
    player2_id: z.string().uuid(),
  }),
})

export type GameRowWithMatch = z.infer<typeof gameRowWithMatch>
