import {
  MIN_ERRORS_FOR_RATE,
  MIN_GAMES_FOR_WIN_RATE,
  MIN_RALLIES_FOR_RATE,
} from "@/features/dashboard/lib/insight-thresholds"

import type {
  DecisiveShots,
  ErrorProfile,
  Momentum,
  PlayerHeadline,
  RallyLengths,
  ServeStats,
  SignatureTrait,
} from "@/features/dashboard/schemas/insights"

// One player's attribute model: six measured win rates — never invented
// ratings — derived from the insight RPC payloads the player already
// fetches. The same six numbers drive the card grid, the radar shape, and
// the compare page's diverging rows, so every view reads from one honest
// model. Below a sample threshold a value is null and the UI shows a quiet
// dash instead of a noisy rate.

/** The insight payloads fetched per player. */
export interface PlayerData {
  headline?: PlayerHeadline
  serve?: ServeStats
  error?: ErrorProfile
  rally?: RallyLengths
  momentum?: Momentum
  decisive?: DecisiveShots
}

export type AttributeKey = "srv" | "ret" | "att" | "con" | "grd" | "clu"

/** What each attribute is and how it's measured — the single source for the
 *  computed attributes' labels, the glossary dialog, and any tooltip copy. */
export const ATTRIBUTE_META: Array<{
  key: AttributeKey
  /** three-letter code shown on the card, radar, and rows */
  code: string
  name: string
  /** what the number actually measures — also the accessible label */
  detail: string
}> = [
  {
    key: "srv",
    code: "SRV",
    name: "Serve",
    detail: "Points won on your own serve",
  },
  {
    key: "ret",
    code: "RET",
    name: "Return",
    detail: "Points won when receiving serve",
  },
  {
    key: "att",
    code: "ATT",
    name: "Attack",
    detail: "Short rallies (1–4 shots) won",
  },
  {
    key: "con",
    code: "CON",
    name: "Control",
    detail: "Errors you forced, not gifted cheaply",
  },
  // long (10+) rallies alone are too rare to rate on this much play, so
  // "grind" spans every extended rally (5+ shots) — plenty of sample, same
  // story of who wins the wars of attrition
  {
    key: "grd",
    code: "GRD",
    name: "Grind",
    detail: "Extended rallies (5+ shots) won",
  },
  { key: "clu", code: "CLU", name: "Clutch", detail: "Points won from 9–all" },
]

export interface PlayerAttribute {
  key: AttributeKey
  code: string
  detail: string
  /** 0–100 rate, or null when the sample is below its threshold */
  value: number | null
  /** "58" — or "—" when under-sampled */
  display: string
  /** screen-reader detail, e.g. "29 of 50 short rallies won" */
  sr: string
}

function rate(
  won: number,
  of: number,
  min: number,
  unit: string,
  verb = "won"
): Pick<PlayerAttribute, "value" | "display" | "sr"> {
  if (of < min) {
    // below the threshold a rate is noise — show a quiet dash, not a raw
    // "n=4", and let the accessible label carry the why
    return {
      value: null,
      display: "—",
      sr: `not enough games yet — only ${of} ${unit} so far`,
    }
  }
  const pct = Math.round((won / of) * 100)
  return {
    value: pct,
    display: String(pct),
    sr: `${won} of ${of} ${unit} ${verb}`,
  }
}

const EMPTY = { value: null, display: "—", sr: "no data yet" }

/** The six attributes, in card/radar order. */
export function computePlayerAttributes(d: PlayerData): Array<PlayerAttribute> {
  const { serve, rally, error, momentum } = d

  const rates: Record<
    AttributeKey,
    Pick<PlayerAttribute, "value" | "display" | "sr">
  > = {
    srv: serve
      ? rate(
          serve.serve_wins,
          serve.rallies_served,
          MIN_RALLIES_FOR_RATE,
          "serve rallies"
        )
      : EMPTY,
    ret: serve
      ? rate(
          serve.return_wins,
          serve.rallies_returned,
          MIN_RALLIES_FOR_RATE,
          "return rallies"
        )
      : EMPTY,
    att: rally
      ? rate(
          rally.short_wins,
          rally.short_rallies,
          MIN_RALLIES_FOR_RATE,
          "short rallies"
        )
      : EMPTY,
    con: error
      ? rate(
          error.forced_errors,
          error.forced_errors + error.unforced_errors,
          MIN_ERRORS_FOR_RATE,
          "tagged errors",
          "were forced"
        )
      : EMPTY,
    grd: rally
      ? rate(
          rally.medium_wins + rally.long_wins,
          rally.medium_rallies + rally.long_rallies,
          MIN_RALLIES_FOR_RATE,
          "extended rallies"
        )
      : EMPTY,
    clu: momentum
      ? rate(
          momentum.close_wins,
          momentum.close_rallies,
          MIN_RALLIES_FOR_RATE,
          "close-phase rallies"
        )
      : EMPTY,
  }

  return ATTRIBUTE_META.map(({ key, code, detail }) => ({
    key,
    code,
    detail,
    ...rates[key],
  }))
}

/** The card's hero stat — win rate over the games in view. Unlike average
 *  rally length (a property of the shared rallies, identical for both players
 *  in head-to-head), this is genuinely per-player. */
export function heroStat(d: PlayerData): { display: string; label: string } {
  const h = d.headline
  if (!h || h.games_decided < MIN_GAMES_FOR_WIN_RATE) {
    return { display: "—", label: "Win rate" }
  }
  return {
    display: `${Math.round((h.games_won / h.games_decided) * 100)}%`,
    label: "Win rate",
  }
}

export type TraitTempo = "short" | "all" | "long"
export type TraitAgency = "finisher" | "mixed" | "pressure"

/** The 3×3 trait matrix (§3.2), one entry per cell — the single source for
 *  the card banner label, the signature line, the glossary, and the /traits
 *  reference page. Rows are tempo (where the game lives), columns are agency
 *  (whose racket ends the points you win). */
export const TRAIT_META: Record<
  SignatureTrait,
  {
    label: string
    tempo: TraitTempo
    agency: TraitAgency
    /** One-line meaning for the glossary and the traits page. */
    blurb: string
  }
> = {
  sniper: {
    label: "Sniper",
    tempo: "short",
    agency: "finisher",
    blurb: "Points end fast, on this player's own clean winner.",
  },
  shotmaker: {
    label: "Shotmaker",
    tempo: "short",
    agency: "mixed",
    blurb: "Lives in short rallies, with points ending every which way.",
  },
  enforcer: {
    label: "Enforcer",
    tempo: "short",
    agency: "pressure",
    blurb: "Points end fast — and it's the opponent's racket that cracks.",
  },
  marksman: {
    label: "Marksman",
    tempo: "all",
    agency: "finisher",
    blurb: "Any rally length, but the finish is this player's own winner.",
  },
  all_rounder: {
    label: "All-Rounder",
    tempo: "all",
    agency: "mixed",
    blurb: "No lean either way — comfortable at every length and finish.",
  },
  grafter: {
    label: "Grafter",
    tempo: "all",
    agency: "pressure",
    blurb: "Works the opponent into errors, point after point.",
  },
  hunter: {
    label: "Hunter",
    tempo: "long",
    agency: "finisher",
    blurb: "Stalks the long rally, then takes the kill personally.",
  },
  grinder: {
    label: "Grinder",
    tempo: "long",
    agency: "mixed",
    blurb: "Wins the wars of attrition — the longer, the better.",
  },
  wall: {
    label: "Wall",
    tempo: "long",
    agency: "pressure",
    blurb: "Everything comes back, until the opponent breaks.",
  },
}

export const TRAIT_LABELS = Object.fromEntries(
  Object.entries(TRAIT_META).map(([key, meta]) => [key, meta.label])
) as Record<SignatureTrait, string>

function bucketRate(wins: number, rallies: number): number | null {
  return rallies > 0 ? Math.round((wins / rallies) * 100) : null
}

/** The card's one-line signature read (§3.2): the trait plus the numbers
 *  that earned it — the tempo bucket's win rate and/or the clean-finish
 *  share. Null when the trait can't be called; the headline RPC gates that. */
export function signatureLine(
  headline: Pick<
    PlayerHeadline,
    "signature_trait" | "clean_finish_wins" | "points_won"
  >,
  lengths: Pick<
    RallyLengths,
    | "short_wins"
    | "short_rallies"
    | "medium_wins"
    | "medium_rallies"
    | "long_wins"
    | "long_rallies"
  >
) {
  const short = bucketRate(lengths.short_wins, lengths.short_rallies)
  const ext = bucketRate(
    lengths.medium_wins + lengths.long_wins,
    lengths.medium_rallies + lengths.long_rallies
  )
  const clean =
    headline.points_won > 0
      ? Math.round((headline.clean_finish_wins / headline.points_won) * 100)
      : null
  const given = clean === null ? null : 100 - clean

  switch (headline.signature_trait) {
    case "sniper":
      return short !== null && clean !== null
        ? `Sniper — wins ${short}% of 1–3 shot rallies, ${clean}% on clean winners`
        : "Sniper — short points, finished personally"
    case "shotmaker":
      return short !== null
        ? `Shotmaker — wins ${short}% of 1–3 shot rallies`
        : "Shotmaker — stronger in short rallies"
    case "enforcer":
      return short !== null && given !== null
        ? `Enforcer — wins ${short}% of 1–3 shot rallies, ${given}% by forcing the error`
        : "Enforcer — short points, won on pressure"
    case "marksman":
      return clean !== null
        ? `Marksman — ends ${clean}% of won points with a clean winner`
        : "Marksman — finishes points personally at any length"
    case "all_rounder":
      return "All-Rounder — no clear lean by rally length or finish"
    case "grafter":
      return given !== null
        ? `Grafter — ${given}% of points won come from opponent errors`
        : "Grafter — wins by working the opponent into errors"
    case "hunter":
      return ext !== null && clean !== null
        ? `Hunter — wins ${ext}% of 5+ shot rallies, ${clean}% on clean winners`
        : "Hunter — long rallies, finished personally"
    case "grinder":
      return ext !== null
        ? `Grinder — wins ${ext}% of 5+ shot rallies`
        : "Grinder — stronger the longer the rally"
    case "wall":
      return ext !== null && given !== null
        ? `Wall — wins ${ext}% of 5+ shot rallies, ${given}% off opponent errors`
        : "Wall — outlasts everything until the error comes"
    default:
      return null
  }
}

/** The card's class line — a passthrough of the SQL-computed matrix cell.
 *  The old average-rally-length fallback is gone deliberately: on this
 *  club's fast games it labelled everyone "shotmaker", and a missing trait
 *  is more honest than an invented one. */
export function playerTrait(d: PlayerData): SignatureTrait | null {
  return d.headline?.signature_trait ?? null
}
