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
