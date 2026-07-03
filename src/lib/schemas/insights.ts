import { z } from "zod"

import { ballType, handedness } from "./enums"

// Schemas for the 0004a insight RPCs (§8.4). The generated DB types say
// `Json` for the jsonb payloads — these schemas pin the actual shapes at the
// query boundary, so a malformed payload fails loudly there, not as a
// rendering bug three components deep.

export const signatureTrait = z.enum(["grinder", "shotmaker", "balanced"])
export type SignatureTrait = z.infer<typeof signatureTrait>

/** One entry of `player_headline.recent_games` — a game result seen from the
 *  headlined player's side. `won` is null for an undecided (tied) game. */
export const headlineGame = z.object({
  game_id: z.string().uuid(),
  match_id: z.string().uuid(),
  game_number: z.number().int(),
  date: z.string(),
  opponent_id: z.string().uuid(),
  player_score: z.number().int(),
  opponent_score: z.number().int(),
  won: z.boolean().nullable(),
})

export type HeadlineGame = z.infer<typeof headlineGame>

/** `player_headline(...)` — win rate inputs over decided games, records,
 *  recent form, signature trait (§3.2). Rates are computed in the UI from
 *  the numerator/denominator pairs, never returned bare (§3.5). */
export const playerHeadline = z.object({
  player_id: z.string().uuid(),
  games_won: z.number().int(),
  games_decided: z.number().int(),
  matches_won: z.number().int(),
  matches_decided: z.number().int(),
  signature_trait: signatureTrait.nullable(),
  recent_games: z.array(headlineGame),
})

export type PlayerHeadline = z.infer<typeof playerHeadline>

/** One row of `players_headline()` — the roster batch: headline + identity. */
export const rosterHeadline = playerHeadline.extend({
  name: z.string(),
  handedness: handedness.nullable(),
})

export type RosterHeadline = z.infer<typeof rosterHeadline>

/** One entry of `h2h.match_history`, date-ascending. `_p1` means the first
 *  argument of the h2h call, matching the aggregate's columns. */
export const h2hMatch = z.object({
  match_id: z.string().uuid(),
  date: z.string(),
  games_won_p1: z.number().int(),
  games_won_p2: z.number().int(),
  winner_id: z.string().uuid().nullable(),
})

export type H2hMatch = z.infer<typeof h2hMatch>

/** `h2h(p1, p2, ...)` — the pair's record from p1's perspective. */
export const h2hResult = z.object({
  games_won_p1: z.number().int(),
  games_won_p2: z.number().int(),
  games_decided: z.number().int(),
  matches_won_p1: z.number().int(),
  matches_won_p2: z.number().int(),
  matches_decided: z.number().int(),
  match_history: z.array(h2hMatch),
})

export type H2hResult = z.infer<typeof h2hResult>

/** The cross-cutting filters every insight RPC takes (§3.6). */
export const insightFilters = z.object({
  opponentId: z.string().uuid().nullish(),
  ballType: ballType.nullish(),
  dateFrom: z.string().nullish(),
  dateTo: z.string().nullish(),
})

export type InsightFilters = z.infer<typeof insightFilters>
