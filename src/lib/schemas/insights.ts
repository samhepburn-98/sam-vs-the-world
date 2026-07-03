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

/** `serve_stats(...)` — every §3.3.2 pinned serve derivation as
 *  numerator/denominator count pairs; rates are computed in the UI (§3.5).
 *  Lets are excluded from every denominator. The serve-number stats
 *  (first_serve_faults, serve1/serve2) span two-serve matches only —
 *  `two_serve_rallies_served` is their denominator. */
export const serveStats = z.object({
  rallies_served: z.number().int(),
  serve_wins: z.number().int(),
  rallies_returned: z.number().int(),
  return_wins: z.number().int(),
  aces: z.number().int(),
  double_faults: z.number().int(),
  two_serve_rallies_served: z.number().int(),
  first_serve_faults: z.number().int(),
  serve1_served: z.number().int(),
  serve1_wins: z.number().int(),
  serve2_served: z.number().int(),
  serve2_wins: z.number().int(),
  left_served: z.number().int(),
  left_wins: z.number().int(),
  right_served: z.number().int(),
  right_wins: z.number().int(),
})

export type ServeStats = z.infer<typeof serveStats>

/** One entry of `error_profile.trend`, date-ascending — errors-per-game for
 *  one match is `errors / games`. */
export const errorTrendPoint = z.object({
  match_id: z.string().uuid(),
  date: z.string(),
  errors: z.number().int(),
  games: z.number().int(),
})

export type ErrorTrendPoint = z.infer<typeof errorTrendPoint>

/** `error_profile(...)` — the player's errors (error-maker = non-winner,
 *  over `error` + `serve_fault`). The forced three-way spans `error` rows
 *  only, so the parts sum to less than errors_total when serve faults
 *  exist; `untagged` is reported, never folded into either side. */
export const errorProfile = z.object({
  errors_total: z.number().int(),
  forced_errors: z.number().int(),
  unforced_errors: z.number().int(),
  untagged_errors: z.number().int(),
  tin: z.number().int(),
  out_top: z.number().int(),
  out_side: z.number().int(),
  out_back: z.number().int(),
  not_up: z.number().int(),
  double_bounce: z.number().int(),
  detail_untagged: z.number().int(),
  games_played: z.number().int(),
  trend: z.array(errorTrendPoint),
})

export type ErrorProfile = z.infer<typeof errorProfile>

/** `rally_lengths(...)` — average + longest over decided rallies with a
 *  tagged length ≥ 1 (untagged and 0-shot double faults excluded), and the
 *  three histogram buckets each with its win count. `avg_length` is null
 *  when there are no counted rallies. */
export const rallyLengths = z.object({
  total_rallies: z.number().int(),
  avg_length: z.number().nullable(),
  longest: z.number().int(),
  short_rallies: z.number().int(),
  short_wins: z.number().int(),
  medium_rallies: z.number().int(),
  medium_wins: z.number().int(),
  long_rallies: z.number().int(),
  long_wins: z.number().int(),
})

export type RallyLengths = z.infer<typeof rallyLengths>

/** The length bucket a drill-through targets — matches the RPC's p_bucket. */
export const lengthBucket = z.enum(["short", "medium", "long"])
export type LengthBucket = z.infer<typeof lengthBucket>

/** One entry of `momentum.comeback_games`, date-ascending — a game the
 *  player trailed by `max_deficit` and still won. */
export const comebackGame = z.object({
  game_id: z.string().uuid(),
  match_id: z.string().uuid(),
  date: z.string(),
  max_deficit: z.number().int(),
  player_score: z.number().int(),
  opponent_score: z.number().int(),
})

export type ComebackGame = z.infer<typeof comebackGame>

/** `momentum(...)` — comebacks, the longest within-game win streak, and the
 *  phase win-share bands (each a wins/rallies pair). `longest_streak_game_id`
 *  is null when no rally has been won yet. */
export const momentum = z.object({
  comebacks: z.number().int(),
  longest_streak: z.number().int(),
  longest_streak_game_id: z.string().uuid().nullable(),
  early_rallies: z.number().int(),
  early_wins: z.number().int(),
  mid_rallies: z.number().int(),
  mid_wins: z.number().int(),
  close_rallies: z.number().int(),
  close_wins: z.number().int(),
  comeback_games: z.array(comebackGame),
})

export type Momentum = z.infer<typeof momentum>

/** The cross-cutting filters every insight RPC takes (§3.6). */
export const insightFilters = z.object({
  opponentId: z.string().uuid().nullish(),
  ballType: ballType.nullish(),
  dateFrom: z.string().nullish(),
  dateTo: z.string().nullish(),
})

export type InsightFilters = z.infer<typeof insightFilters>
