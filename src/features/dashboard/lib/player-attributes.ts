import {
  MIN_ERRORS_FOR_RATE,
  MIN_GAMES_FOR_WIN_RATE,
  MIN_RALLIES_FOR_RATE,
} from "@/features/dashboard/utils/insight-thresholds"

import type {
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

/** The five insight payloads fetched per player. */
export interface PlayerData {
  headline?: PlayerHeadline
  serve?: ServeStats
  error?: ErrorProfile
  rally?: RallyLengths
  momentum?: Momentum
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

export const TRAIT_LABELS: Record<SignatureTrait, string> = {
  grinder: "Grinder",
  shotmaker: "Shotmaker",
  balanced: "Balanced",
}

function bucketRate(wins: number, rallies: number): number | null {
  return rallies > 0 ? Math.round((wins / rallies) * 100) : null
}

/** The card's one-line signature read (§3.2): "Grinder — wins 61% of 9+ shot
 *  rallies", etc. Null when the trait can't be called (too few rallies in a
 *  bucket) — the headline RPC already gates that. */
export function signatureLine(
  headline: Pick<PlayerHeadline, "signature_trait">,
  lengths: Pick<
    RallyLengths,
    "long_wins" | "long_rallies" | "short_wins" | "short_rallies"
  >
) {
  const long = bucketRate(lengths.long_wins, lengths.long_rallies)
  const short = bucketRate(lengths.short_wins, lengths.short_rallies)
  switch (headline.signature_trait) {
    case "grinder":
      return long === null
        ? "Grinder — stronger the longer the rally"
        : `Grinder — wins ${long}% of 9+ shot rallies`
    case "shotmaker":
      return short === null
        ? "Shotmaker — stronger in short rallies"
        : `Shotmaker — wins ${short}% of 1–3 shot rallies`
    case "balanced":
      return "Balanced — no clear long- or short-rally edge"
    default:
      return null
  }
}

/** The card's class line. Prefers the SQL-computed signature_trait; until
 *  there's enough tagged play for that, falls back to the shape of the
 *  average rally — long rallies mark a grinder, short ones a shotmaker. */
export function playerTrait(d: PlayerData): SignatureTrait | null {
  if (d.headline?.signature_trait) return d.headline.signature_trait
  const avg = d.rally?.avg_length
  if (avg == null) return null
  if (avg >= 6.5) return "grinder"
  if (avg <= 4.5) return "shotmaker"
  return "balanced"
}
