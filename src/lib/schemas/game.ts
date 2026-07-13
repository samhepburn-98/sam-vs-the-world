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

export const gameEditSchema = z.object({
  gameNumber: z.number().int().min(1, "Game number must be positive"),
})

export type GameEditInput = z.infer<typeof gameEditSchema>

/** One row of the game_results view — the derived score and winner. */
export const gameResultRow = z.object({
  game_id: z.string().uuid(),
  score_p1: z.number().int(),
  score_p2: z.number().int(),
  winner_id: z.string().uuid().nullable(),
  is_undecided: z.boolean(),
})

export type GameResultRow = z.infer<typeof gameResultRow>

/** A game_results row scoped to its match — the profile history's score
 *  pills, grouped by match and ordered by game_number. */
export const gameResultInMatch = gameResultRow.extend({
  match_id: z.string().uuid(),
  game_number: z.number().int(),
})

export type GameResultInMatch = z.infer<typeof gameResultInMatch>

/** The browser's games row: stored columns + parent match + derived result
 *  (null = no rallies logged yet, so the view has nothing to derive). */
export interface GameBrowserRow extends GameRowWithMatch {
  result: GameResultRow | null
}
