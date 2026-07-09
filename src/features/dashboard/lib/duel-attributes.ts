import {
  MIN_ERRORS_FOR_RATE,
  MIN_GAMES_FOR_WIN_RATE,
  MIN_RALLIES_FOR_RATE,
} from "@/features/dashboard/utils/insight-thresholds"

import type {
  ErrorProfile,
  H2hResult,
  Momentum,
  PlayerHeadline,
  RallyLengths,
  ServeStats,
  SignatureTrait,
} from "@/features/dashboard/schemas/insights"

// The duel model (§5.1 redesign): six measured win rates — never invented
// ratings — derived from the insight RPC payloads each player already
// fetches. The same six numbers drive the card grid, the radar shape, and
// the centre comparison rows, so the whole duel is one honest model viewed
// three ways. Below a threshold a value is null and the UI says "n=X"
// instead of showing a noisy rate (§3.5).

/** The five insight payloads the compare page fetches per player. */
export interface PlayerData {
  headline?: PlayerHeadline
  serve?: ServeStats
  error?: ErrorProfile
  rally?: RallyLengths
  momentum?: Momentum
}

export type DuelAttrKey = "srv" | "ret" | "att" | "con" | "grd" | "clu"

export interface DuelAttribute {
  key: DuelAttrKey
  /** three-letter code shown on the card, radar, and rows */
  code: string
  /** what the number actually measures — surfaced as the accessible label */
  detail: string
  /** 0–100 rate, or null when the sample is below its threshold */
  value: number | null
  /** "58" — or "n=12" when under-sampled */
  display: string
  /** screen-reader detail, e.g. "29 of 50 short rallies won" */
  sr: string
}

function rate(
  won: number,
  of: number,
  min: number,
  unit: string,
  verb = "won",
): Pick<DuelAttribute, "value" | "display" | "sr"> {
  if (of < min) {
    return { value: null, display: `n=${of}`, sr: `only ${of} ${unit} so far` }
  }
  const pct = Math.round((won / of) * 100)
  return { value: pct, display: String(pct), sr: `${won} of ${of} ${unit} ${verb}` }
}

/** The six duel attributes, in card/radar order. */
export function computeDuelAttributes(d: PlayerData): Array<DuelAttribute> {
  const serve = d.serve
  const rally = d.rally
  const error = d.error
  const momentum = d.momentum
  const empty = { value: null, display: "—", sr: "no data yet" }

  return [
    {
      key: "srv",
      code: "SRV",
      detail: "Points won when serving",
      ...(serve
        ? rate(serve.serve_wins, serve.rallies_served, MIN_RALLIES_FOR_RATE, "serve rallies")
        : empty),
    },
    {
      key: "ret",
      code: "RET",
      detail: "Points won when returning",
      ...(serve
        ? rate(serve.return_wins, serve.rallies_returned, MIN_RALLIES_FOR_RATE, "return rallies")
        : empty),
    },
    {
      key: "att",
      code: "ATT",
      detail: "Short rallies won (1–4 shots)",
      ...(rally
        ? rate(rally.short_wins, rally.short_rallies, MIN_RALLIES_FOR_RATE, "short rallies")
        : empty),
    },
    {
      key: "con",
      code: "CON",
      detail: "Errors forced, not gifted",
      ...(error
        ? rate(
            error.forced_errors,
            error.forced_errors + error.unforced_errors,
            MIN_ERRORS_FOR_RATE,
            "tagged errors",
            "were forced",
          )
        : empty),
    },
    {
      key: "grd",
      code: "GRD",
      detail: "Long rallies won (10+ shots)",
      ...(rally
        ? rate(rally.long_wins, rally.long_rallies, MIN_RALLIES_FOR_RATE, "long rallies")
        : empty),
    },
    {
      key: "clu",
      code: "CLU",
      detail: "Points won from 9–all",
      ...(momentum
        ? rate(momentum.close_wins, momentum.close_rallies, MIN_RALLIES_FOR_RATE, "close-phase rallies")
        : empty),
    },
  ]
}

/** Attribute rows the duel is scored on: both measured, and not tied. */
export function duelTally(
  a1: Array<DuelAttribute>,
  a2: Array<DuelAttribute>,
): { p1: number; p2: number } {
  let p1 = 0
  let p2 = 0
  for (const a of a1) {
    const b = a2.find((x) => x.key === a.key)
    if (!b || a.value === null || b.value === null || a.value === b.value) continue
    if (a.value > b.value) p1 += 1
    else p2 += 1
  }
  return { p1, p2 }
}

/** The card's hero stat — average rally length, the shape of how they play. */
export function heroStat(d: PlayerData): { display: string; label: string } {
  const avg = d.rally?.avg_length
  return {
    display: avg == null ? "—" : avg.toFixed(1),
    label: "Avg rally",
  }
}

export const TRAIT_LABELS: Record<SignatureTrait, string> = {
  grinder: "Grinder",
  shotmaker: "Shotmaker",
  balanced: "Balanced",
}

/** One earned pill per category — the plainly higher side takes it; ties and
 *  unmeasured values award nobody. Capped at two per player, list order. */
export function superlatives(
  d1: PlayerData,
  d2: PlayerData,
  a1: Array<DuelAttribute>,
  a2: Array<DuelAttribute>,
): { p1: Array<string>; p2: Array<string> } {
  const attr = (attrs: Array<DuelAttribute>, key: DuelAttrKey) =>
    attrs.find((a) => a.key === key)?.value ?? null
  const checks: Array<{ label: string; v1: number | null; v2: number | null }> = [
    { label: "Comeback king", v1: d1.momentum?.comebacks ?? null, v2: d2.momentum?.comebacks ?? null },
    { label: "Iron nerve", v1: attr(a1, "clu"), v2: attr(a2, "clu") },
    { label: "Big server", v1: attr(a1, "srv"), v2: attr(a2, "srv") },
    { label: "Shot machine", v1: attr(a1, "att"), v2: attr(a2, "att") },
    { label: "Grind merchant", v1: attr(a1, "grd"), v2: attr(a2, "grd") },
    { label: "Marathon man", v1: d1.rally?.longest ?? null, v2: d2.rally?.longest ?? null },
  ]
  const p1: Array<string> = []
  const p2: Array<string> = []
  for (const c of checks) {
    if (c.v1 === null || c.v2 === null || c.v1 === c.v2) continue
    const winner = c.v1 > c.v2 ? p1 : p2
    if (winner.length < 2) winner.push(c.label)
  }
  return { p1, p2 }
}

/** Dominance in head-to-head mode: share of their shared games won. */
export function dominanceFromH2h(h: H2hResult): number | null {
  const total = h.games_won_p1 + h.games_won_p2
  if (total === 0) return null
  return h.games_won_p1 / total
}

/** Dominance in all-games mode: each player's overall win rate, normalised
 *  against the other's. Not a shared score — a form comparison. */
export function dominanceFromForm(
  h1?: PlayerHeadline,
  h2?: PlayerHeadline,
): number | null {
  if (!h1 || !h2) return null
  if (h1.games_decided < MIN_GAMES_FOR_WIN_RATE || h2.games_decided < MIN_GAMES_FOR_WIN_RATE)
    return null
  const r1 = h1.games_won / h1.games_decided
  const r2 = h2.games_won / h2.games_decided
  if (r1 + r2 === 0) return null
  return r1 / (r1 + r2)
}
