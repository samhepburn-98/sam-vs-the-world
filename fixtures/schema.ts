import { z } from "zod"

// Golden-fixture schemas — the single source of expected truth shared by the
// SQL derivation suite (supabase/tests) and the TS scoring engine (lib/scoring,
// §8.7 #2). Fixture files are zod-parsed on load, so a malformed fixture fails
// loudly rather than producing a vacuous test.

export const playerRef = z.enum(["p1", "p2"])

export const fixtureRally = z.object({
  server: playerRef,
  side: z.enum(["left", "right"]),
  serveNumber: z.union([z.literal(1), z.literal(2)]),
  /** null = let */
  winner: playerRef.nullable(),
  endReason: z.enum(["winner", "error", "stroke", "let", "ace", "serve_fault"]),
  errorDetail: z
    .enum(["tin", "out_top", "out_side", "out_back", "not_up", "double_bounce"])
    .optional(),
  forced: z.boolean().optional(),
  shotCount: z.number().int().min(0).optional(),
})

export const gameFixture = z.object({
  name: z.string(),
  description: z.string(),
  targetScore: z.number().int().positive(),
  tiebreak: z.enum(["win_by_2", "sudden_death"]),
  /** house rule (§7.7); omitted = 2, the default two-serve game */
  servesPerPoint: z.union([z.literal(1), z.literal(2)]).optional(),
  rallies: z.array(fixtureRally).min(1),
  expected: z.object({
    /** [scoreP1, scoreP2] AFTER each rally, aligned with `rallies` */
    runningScores: z.array(z.tuple([z.number().int(), z.number().int()])),
    result: z.object({
      scoreP1: z.number().int(),
      scoreP2: z.number().int(),
      winner: playerRef.nullable(),
      undecided: z.boolean(),
    }),
    /** rows that must appear in errors_attributed, exactly */
    errors: z
      .array(
        z.object({
          rallyNumber: z.number().int(),
          maker: playerRef,
          endReason: z.enum(["error", "serve_fault"]),
        })
      )
      .optional(),
  }),
})

export const matchFixture = z.object({
  name: z.string(),
  description: z.string(),
  /** null = casual session */
  format: z.union([z.literal(3), z.literal(5)]).nullable(),
  /** per game: who leads at its final rally; "tie" = game left tied/undecided */
  gameWinners: z.array(z.union([playerRef, z.literal("tie")])).min(1),
  expected: z.object({
    gamesWonP1: z.number().int(),
    gamesWonP2: z.number().int(),
    matchWinner: playerRef.nullable(),
    /** the view's verdict column, mirrored by lib/scoring's deriveOutcome */
    outcome: z.enum(["p1", "p2", "draw", "pending"]),
  }),
})

export type GameFixture = z.infer<typeof gameFixture>
export type MatchFixture = z.infer<typeof matchFixture>
export type FixtureRally = z.infer<typeof fixtureRally>
