import { z } from "zod"

import { handedness } from "./enums"

export const playerSummary = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  handedness: handedness.nullable(),
  // full public storage URL (with a ?v= cache-buster), or null for the
  // silhouette fallback
  avatar_url: z.string().nullable(),
})

export type PlayerSummary = z.infer<typeof playerSummary>

/** The columns a `select()` must fetch to satisfy `playerSummary` — derived
 *  from the schema so a query can never drift from it (a select that omits a
 *  key parses to a throw, not a type error). */
export const PLAYER_SUMMARY_COLUMNS = Object.keys(playerSummary.shape).join(", ")

/** Every stored column — the /manage raw browser's row. */
export const playerRow = playerSummary.extend({
  created_at: z.string(),
  updated_at: z.string(),
})

export type PlayerRow = z.infer<typeof playerRow>

export const playerEditSchema = z.object({
  name: z.string().trim().min(1, "Give the player a name"),
  handedness: handedness.nullable(),
})

export type PlayerEditInput = z.infer<typeof playerEditSchema>

export const newPlayerSchema = z.object({
  name: z.string().trim().min(1, "Give the player a name"),
})

export type NewPlayerInput = z.infer<typeof newPlayerSchema>
