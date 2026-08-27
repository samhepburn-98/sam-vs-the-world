import { MIN_GAMES_FOR_WIN_RATE } from "@/features/dashboard/lib/insight-thresholds"

import type {
  AttributeKey,
  PlayerAttribute,
  PlayerData,
} from "@/features/dashboard/lib/player-attributes"
import type {
  H2hResult,
  PlayerHeadline,
} from "@/features/dashboard/schemas/insights"

// The two-player half of the compare page: scoring one player's attributes
// against the other's. Everything here needs both players; the one-player
// derivation lives in player-attributes.ts.

/** Attribute rows the duel is scored on: both measured, and not tied. */
export function duelTally(
  a1: Array<PlayerAttribute>,
  a2: Array<PlayerAttribute>
): { p1: number; p2: number } {
  let p1 = 0
  let p2 = 0
  for (const a of a1) {
    const b = a2.find((x) => x.key === a.key)
    if (!b || a.value === null || b.value === null || a.value === b.value)
      continue
    if (a.value > b.value) p1 += 1
    else p2 += 1
  }
  return { p1, p2 }
}

/** One earned pill per category — the plainly higher side takes it; ties and
 *  unmeasured values award nobody. Capped at two per player, list order. */
export function superlatives(
  d1: PlayerData,
  d2: PlayerData,
  a1: Array<PlayerAttribute>,
  a2: Array<PlayerAttribute>
): { p1: Array<string>; p2: Array<string> } {
  const attr = (attrs: Array<PlayerAttribute>, key: AttributeKey) =>
    attrs.find((a) => a.key === key)?.value ?? null
  const checks: Array<{ label: string; v1: number | null; v2: number | null }> =
    [
      {
        label: "Comeback king",
        v1: d1.momentum?.comebacks ?? null,
        v2: d2.momentum?.comebacks ?? null,
      },
      { label: "Iron nerve", v1: attr(a1, "clu"), v2: attr(a2, "clu") },
      { label: "Big server", v1: attr(a1, "srv"), v2: attr(a2, "srv") },
      { label: "Shot machine", v1: attr(a1, "att"), v2: attr(a2, "att") },
      { label: "Grind merchant", v1: attr(a1, "grd"), v2: attr(a2, "grd") },
      {
        label: "Marathon man",
        v1: d1.rally?.longest ?? null,
        v2: d2.rally?.longest ?? null,
      },
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
  h2?: PlayerHeadline
): number | null {
  if (!h1 || !h2) return null
  if (
    h1.games_decided < MIN_GAMES_FOR_WIN_RATE ||
    h2.games_decided < MIN_GAMES_FOR_WIN_RATE
  )
    return null
  const r1 = h1.games_won / h1.games_decided
  const r2 = h2.games_won / h2.games_decided
  if (r1 + r2 === 0) return null
  return r1 / (r1 + r2)
}
