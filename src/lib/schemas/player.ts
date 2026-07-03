import { z } from "zod"

import { handedness } from "./enums"

export const playerSummary = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  handedness: handedness.nullable(),
})

export type PlayerSummary = z.infer<typeof playerSummary>

/** Every stored column — the /manage raw browser's row (§5.4). */
export const playerRow = playerSummary.extend({
  created_at: z.string(),
  updated_at: z.string(),
})

export type PlayerRow = z.infer<typeof playerRow>

export const newPlayerSchema = z.object({
  name: z.string().trim().min(1, "Give the player a name"),
})

export type NewPlayerInput = z.infer<typeof newPlayerSchema>
