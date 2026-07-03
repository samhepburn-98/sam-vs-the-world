import { z } from "zod"

import { ballType, tiebreak } from "./enums"
import { rallySummary } from "./rally"

// House rules (§7.7) — the form section and the insert payload validate with
// the same schema. Defaults mirror lib/scoring's DEFAULT_HOUSE_RULES.

export const houseRulesSchema = z.object({
  /** null = casual session; odd 1–9 = best-of (DB CHECK backstops) */
  format: z
    .number()
    .int()
    .min(1)
    .max(9)
    .refine((n) => n % 2 === 1, "Best-of must be odd")
    .nullable(),
  targetScore: z.number().int().min(1).max(99),
  tiebreak,
  servesPerPoint: z.union([z.literal(1), z.literal(2)]),
  letResetsServe: z.boolean(),
  ballType: ballType.nullable(),
})

export const matchSetupSchema = z
  .object({
    player1Id: z.string().uuid("Pick a player"),
    player2Id: z.string().uuid("Pick a player"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
    venue: z.string().trim().max(120).optional(),
    firstServerId: z.string().uuid("Choose who serves first"),
    houseRules: houseRulesSchema,
  })
  .refine((v) => v.player1Id !== v.player2Id, {
    message: "Pick two different players",
    path: ["player2Id"],
  })
  .refine(
    (v) => v.firstServerId === v.player1Id || v.firstServerId === v.player2Id,
    { message: "First server must be one of the players", path: ["firstServerId"] },
  )

export type HouseRulesInput = z.infer<typeof houseRulesSchema>
export type MatchSetupInput = z.infer<typeof matchSetupSchema>

/** The manage edit sheet (§5.4): everything stored is editable; the DB
 *  trigger backstops player changes that would orphan rallies. */
export const matchEditSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
    player1Id: z.string().uuid("Pick a player"),
    player2Id: z.string().uuid("Pick a player"),
    venue: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(2000).optional(),
    houseRules: houseRulesSchema,
  })
  .refine((v) => v.player1Id !== v.player2Id, {
    message: "Pick two different players",
    path: ["player2Id"],
  })

export type MatchEditInput = z.infer<typeof matchEditSchema>

/** Summary shape for the recent-matches list (players resolved separately). */
export const matchSummary = z.object({
  id: z.string().uuid(),
  date: z.string(),
  player1_id: z.string().uuid(),
  player2_id: z.string().uuid(),
  venue: z.string().nullable(),
  format: z.number().nullable(),
  created_at: z.string(),
})

export type MatchSummary = z.infer<typeof matchSummary>

/** The recent-matches list on the home hub (§5.1): the derived result of a
 *  match, names resolved separately from the roster. From `match_results`. */
export const matchResultSummary = z.object({
  match_id: z.string().uuid(),
  date: z.string(),
  player1_id: z.string().uuid(),
  player2_id: z.string().uuid(),
  games_won_p1: z.number().int().nullable(),
  games_won_p2: z.number().int().nullable(),
  match_winner_id: z.string().uuid().nullable(),
  ball_type: ballType.nullable(),
})

export type MatchResultSummary = z.infer<typeof matchResultSummary>

/** The match history row (§5.2): the derived result plus the badges the list
 *  shows. From `match_results`; names resolved separately. */
export const matchListRow = matchResultSummary.extend({
  venue: z.string().nullable(),
  format: z.number().nullable(),
  target_score: z.number().int(),
})

export type MatchListRow = z.infer<typeof matchListRow>

/** Every stored column — the /manage raw browser's row (§5.4). */
export const matchRow = matchSummary.extend({
  target_score: z.number().int(),
  tiebreak,
  serves_per_point: z.number().int(),
  let_resets_serve: z.boolean(),
  ball_type: ballType.nullable(),
  notes: z.string().nullable(),
  updated_at: z.string(),
})

export type MatchRow = z.infer<typeof matchRow>

export const gameWithRallies = z.object({
  id: z.string().uuid(),
  game_number: z.number().int(),
  rallies: z.array(rallySummary),
})

/** Detail extends summary (§8.4): the full match for resuming in the logger. */
export const matchDetail = matchSummary.extend({
  target_score: z.number().int(),
  tiebreak,
  serves_per_point: z.number().int(),
  let_resets_serve: z.boolean(),
  ball_type: ballType.nullable(),
  notes: z.string().nullable(),
  games: z.array(gameWithRallies),
})

export type GameWithRallies = z.infer<typeof gameWithRallies>
export type MatchDetail = z.infer<typeof matchDetail>
