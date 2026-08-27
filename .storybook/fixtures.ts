import { computePlayerAttributes } from "@/features/dashboard/lib/player-attributes"
import {
  headline,
  player,
  rally,
  serve,
} from "@/features/dashboard/lib/player-data.fixtures"

import type { PlayerSummary } from "@/lib/schemas/player"

// The cast. Stories share one roster so the same three people recur across
// the sidebar and a reader builds a feel for them — Sam the protagonist,
// Alex the rival, Ormond the third. Insight *shapes* come from
// player-data.fixtures.ts, which the unit tests already use; this file is
// only the people, their ids, and a couple of derived conveniences.

export const IDS = {
  sam: "11111111-1111-4111-8111-111111111111",
  alex: "22222222-2222-4222-8222-222222222222",
  ormond: "33333333-3333-4333-8333-333333333333",
  match: "44444444-4444-4444-8444-444444444444",
} as const

export const SAM: PlayerSummary = {
  id: IDS.sam,
  name: "Sam",
  handedness: "right",
  avatar_url: null,
  is_protagonist: true,
}

export const ALEX: PlayerSummary = {
  id: IDS.alex,
  name: "Alex",
  handedness: "left",
  avatar_url: null,
  is_protagonist: false,
}

export const ORMOND: PlayerSummary = {
  id: IDS.ormond,
  name: "Ormond",
  handedness: "right",
  avatar_url: null,
  is_protagonist: false,
}

export const ROSTER: Array<PlayerSummary> = [SAM, ALEX, ORMOND]

/** A plausible PlayerData for each side, so a duel has two distinct shapes
 *  rather than the same numbers mirrored. */
export const SAM_DATA = player()
export const ALEX_DATA = player({
  serve: serve({ serve_wins: 41, aces: 2, double_faults: 7 }),
  rally: rally({ avg_length: 6.1, longest: 23 }),
})

export const SAM_ATTRS = computePlayerAttributes(SAM_DATA)
export const ALEX_ATTRS = computePlayerAttributes(ALEX_DATA)

/** The under-sampled case: every honesty gate trips, so a story can show
 *  what the component does when the data isn't there yet. */
export const THIN_DATA = player({
  headline: headline({ games_won: 1, games_decided: 2 }),
  rally: rally({ total_rallies: 3, avg_length: 4 }),
})
export const THIN_ATTRS = computePlayerAttributes(THIN_DATA)
