import { z } from "zod"

import { Constants } from "@/lib/database.types"

// zod enums built FROM the generated constants — one source: the database.
// If a migration changes an enum, typegen changes Constants, and every schema
// (and its z.infer type) follows automatically.

const E = Constants.public.Enums

export const ballType = z.enum(E.ball_type)
export const endReason = z.enum(E.end_reason)
export const errorDetail = z.enum(E.error_detail)
export const handedness = z.enum(E.handedness)
export const serveSide = z.enum(E.serve_side)
export const shotType = z.enum(E.shot_type)
export const tiebreak = z.enum(E.tiebreak)

export type BallType = z.infer<typeof ballType>
export type EndReason = z.infer<typeof endReason>
export type ErrorDetail = z.infer<typeof errorDetail>
export type Handedness = z.infer<typeof handedness>
export type ServeSide = z.infer<typeof serveSide>
export type ShotType = z.infer<typeof shotType>
export type Tiebreak = z.infer<typeof tiebreak>
