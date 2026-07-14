import { z } from "zod"

import { Constants } from "@/lib/database.types"

// zod enums built FROM the generated constants — one source: the database.
// If a migration changes an enum, typegen changes Constants, and every schema
// (and its z.infer type) follows automatically.

const E = Constants.public.Enums

export const ballType = z.enum(E.ball_type)
export const endReason = z.enum(E.end_reason)
export const errorDetail = z.enum(E.error_detail)

/** The error details the logger offers. `double_bounce` is retired — a ball
 *  the opponent never reached is a winner, and one they reached too late is
 *  the textbook not_up. Legacy rows were folded into not_up and a CHECK keeps
 *  the value out of new rows (20260714120000); the member only remains in the
 *  DB enum because Postgres can't drop enum values. */
export const LOGGABLE_ERROR_DETAILS = E.error_detail.filter(
  (d): d is Exclude<ErrorDetail, "double_bounce"> => d !== "double_bounce"
)
export const handedness = z.enum(E.handedness)
export const serveSide = z.enum(E.serve_side)
export const shotType = z.enum(E.shot_type)

/** The shot types the logger offers. Only drive, boast, and drop carry real
 *  signal at review speed — kill was a drive that died, nick/volley are
 *  modifiers, lob is rare as a winner, other is no tag at all. The retired
 *  values stay in the DB enum so legacy rows still read; a CHECK keeps them
 *  out of new rows. */
export const LOGGABLE_SHOT_TYPES = E.shot_type.filter(
  (s): s is Extract<ShotType, "drive" | "boast" | "drop"> =>
    s === "drive" || s === "boast" || s === "drop"
)
export const tiebreak = z.enum(E.tiebreak)

export type BallType = z.infer<typeof ballType>
export type EndReason = z.infer<typeof endReason>
export type ErrorDetail = z.infer<typeof errorDetail>
export type Handedness = z.infer<typeof handedness>
export type ServeSide = z.infer<typeof serveSide>
export type ShotType = z.infer<typeof shotType>
export type Tiebreak = z.infer<typeof tiebreak>
