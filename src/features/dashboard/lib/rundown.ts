import { outcomeChip } from "@/lib/scoring/match"

import type { OutcomeChip } from "@/lib/scoring/match"
import type { MatchResultSummary } from "@/lib/schemas/match"

// The home rundown's presentation logic (§5.1): the ticker's one line of
// truth and each roster row's form strip. Both read a list of match results
// and say something in words, which makes them the kind of thing the route
// layer hands to a component rather than computes — and the kind of thing
// worth pinning with tests, since a wrong verdict here is silently wrong
// rather than visibly broken.

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")

/** "2026-07-14" → "14 Jul". Parsed by parts, never through Date: a bare
 *  ISO date string is UTC midnight, which renders as the previous day for
 *  anyone west of Greenwich. */
export function tickerDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number)
  return `${d} ${MONTHS[m - 1]}`
}

/** The ticker's line for one match: winner first, in plain words. */
export function tickerLine(
  m: MatchResultSummary,
  nameOf: Map<string, string>
): string {
  const p1 = nameOf.get(m.player1_id) ?? "Unknown"
  const p2 = nameOf.get(m.player2_id) ?? "Unknown"
  const s1 = m.games_won_p1 ?? 0
  const s2 = m.games_won_p2 ?? 0
  if (m.outcome === "p1") return `${p1} beat ${p2} ${s1}–${s2}`
  if (m.outcome === "p2") return `${p2} beat ${p1} ${s2}–${s1}`
  if (m.outcome === "draw") return `${p1} ${s1}–${s2} ${p2} · drawn`
  return `In play · ${p1} v ${p2}`
}

/** A player's recent results, oldest first, from the matches given. Pending
 *  matches are dropped rather than shown as a gap: a match still being
 *  logged has no verdict to report, which is what outcomeChip's null says. */
export function formFor(
  playerId: string,
  results: Array<MatchResultSummary>
): Array<OutcomeChip> {
  return results
    .slice()
    .reverse()
    .filter((m) => m.player1_id === playerId || m.player2_id === playerId)
    .map((m) => outcomeChip(m.outcome, m.player1_id === playerId))
    .filter((chip): chip is OutcomeChip => chip !== null)
}
