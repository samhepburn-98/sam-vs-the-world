import { computePlayerAttributes } from "@/features/dashboard/lib/player-attributes"
import {
  decisive,
  error,
  headline,
  momentum,
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
//
// Sam and Alex carry full insight payloads, because most components that
// need data need two contrasting players. Ormond is an identity only — he
// exists to make a roster longer than two and to be the third name in a
// picker. A story wanting numbers for him builds them locally, which is why
// there is no ORMOND_DATA here to shadow.

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

// Two genuinely different players. Every one of the six attributes is fed by
// a different field (srv/ret from serve, att/grd from rally buckets, con from
// the error split, clu from momentum's close phase), so a fixture that only
// overrides serve leaves five of six rows dead level — which makes a duel
// story look broken rather than close. Alex therefore differs on all six:
// the better returner and grinder, the worse server and closer.
export const SAM_DATA = player()
export const ALEX_DATA = player({
  serve: serve({
    serve_wins: 41,
    return_wins: 62,
    aces: 2,
    double_faults: 7,
  }),
  rally: rally({
    avg_length: 11.2,
    longest: 41,
    short_wins: 26,
    medium_wins: 52,
    long_wins: 31,
  }),
  error: error({ forced_errors: 41, unforced_errors: 14 }),
  momentum: momentum({ close_wins: 22 }),
})

export const SAM_ATTRS = computePlayerAttributes(SAM_DATA)
export const ALEX_ATTRS = computePlayerAttributes(ALEX_DATA)

// Somebody who has played once. Every gate is a *denominator* test, so
// thinning the wins alone changes nothing — each denominator has to drop below
// its own threshold: 30 rallies for the rally-level rates (srv, ret, att, grd,
// clu) and 15 tagged errors for the error split (con).
//
// It has to be thin ALL the way through, not just on the six attributes: the
// builders' defaults are a seasoned player, so a partial override prints "—"
// for every attribute while the same page shows a 7–5 match record and the
// trait "Grinder" beside it. Every field below is overridden for that reason,
// and the error counts sum to errors_total the way a real row would.
export const THIN_DATA = player({
  headline: headline({
    games_won: 1,
    games_decided: 2,
    matches_won: 0,
    matches_decided: 1,
    signature_trait: null,
    clean_finish_wins: 2,
    points_won: 17,
    recent_games: [],
  }),
  serve: serve({
    rallies_served: 9,
    serve_wins: 5,
    rallies_returned: 8,
    return_wins: 3,
    aces: 0,
    double_faults: 1,
    two_serve_rallies_served: 9,
    first_serve_faults: 2,
    serve1_served: 9,
    serve1_wins: 4,
    serve2_served: 2,
    serve2_wins: 1,
    left_served: 5,
    left_wins: 3,
    right_served: 4,
    right_wins: 2,
  }),
  rally: rally({
    total_rallies: 17,
    avg_length: 4,
    longest: 9,
    short_rallies: 9,
    short_wins: 4,
    medium_rallies: 6,
    medium_wins: 2,
    long_rallies: 2,
    long_wins: 1,
  }),
  error: error({
    errors_total: 8,
    forced_errors: 4,
    unforced_errors: 3,
    untagged_errors: 1,
    tin: 3,
    out_top: 2,
    out_side: 1,
    out_back: 1,
    not_up: 1,
    detail_untagged: 0,
    games_played: 2,
    trend: [],
  }),
  momentum: momentum({
    comebacks: 0,
    longest_streak: 2,
    early_rallies: 8,
    early_wins: 4,
    mid_rallies: 5,
    mid_wins: 2,
    close_rallies: 5,
    close_wins: 2,
    comeback_games: [],
  }),
  decisive: decisive({
    winning_drive: 2,
    winning_drop: 0,
    winning_boast: 0,
    losing_drive: 1,
    losing_drop: 1,
    losing_boast: 0,
  }),
})
export const THIN_ATTRS = computePlayerAttributes(THIN_DATA)
