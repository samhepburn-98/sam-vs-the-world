import { orientOutcome } from "@/lib/scoring/match"

import type { MatchResultSummary } from "@/lib/schemas/match"

// Head-to-head per rival, aggregated from the player's full match_results
// history — computeProfileShape's sibling for the Stats tab's rivalry table.
// Every verdict comes from the backend's outcome column: wins and losses
// make the record, draws ride along as its third figure, and a pending
// match adds its games but no verdict. A rival appears once any match has
// reached a result — including a draw. The read line is canned copy with
// the numbers dropped in, picked by the shape of the rivalries: the
// toughest rival when one is ahead of you, the closest fight when nobody is.

export interface H2hRow {
  rival: string
  /** Match record, player first — "3–2", growing a third figure ("3–2–1")
   *  once the rivalry holds a draw. */
  matches: string
  /** Game record, player first — "10–8". */
  games: string
  /** Games won share, 0–100. */
  share: number
  /** The newest match that reached a result. */
  last: "won" | "lost" | "drawn"
}

export interface H2hData {
  rows: Array<H2hRow>
  read: string
}

interface Tally {
  rivalId: string
  matchesWon: number
  matchesLost: number
  matchesDrawn: number
  gamesWon: number
  gamesLost: number
  /** Verdict of the newest concluded match (input arrives newest first). */
  last: "won" | "lost" | "drawn" | null
}

export function computeH2h(
  playerId: string,
  matches: Array<MatchResultSummary>,
  nameOf: (id: string) => string
): H2hData {
  const tallies = new Map<string, Tally>()

  // newest first, so the first concluded result per rival is "last"
  const sorted = [...matches].sort((a, b) => b.date.localeCompare(a.date))
  for (const m of sorted) {
    const isP1 = m.player1_id === playerId
    const rivalId = isP1 ? m.player2_id : m.player1_id
    const tally = tallies.get(rivalId) ?? {
      rivalId,
      matchesWon: 0,
      matchesLost: 0,
      matchesDrawn: 0,
      gamesWon: 0,
      gamesLost: 0,
      last: null,
    }
    tally.gamesWon += (isP1 ? m.games_won_p1 : m.games_won_p2) ?? 0
    tally.gamesLost += (isP1 ? m.games_won_p2 : m.games_won_p1) ?? 0
    const verdict = orientOutcome(m.outcome, isP1)
    if (verdict !== "pending") {
      if (verdict === "won") tally.matchesWon += 1
      else if (verdict === "lost") tally.matchesLost += 1
      else tally.matchesDrawn += 1
      tally.last ??= verdict
    }
    tallies.set(rivalId, tally)
  }

  const rows = [...tallies.values()]
    .filter((t): t is Tally & { last: H2hRow["last"] } => t.last !== null)
    .map((t) => {
      const games = t.gamesWon + t.gamesLost
      return {
        rival: nameOf(t.rivalId),
        matches:
          `${t.matchesWon}–${t.matchesLost}` +
          (t.matchesDrawn > 0 ? `–${t.matchesDrawn}` : ""),
        games: `${t.gamesWon}–${t.gamesLost}`,
        share: games > 0 ? Math.round((t.gamesWon / games) * 100) : 0,
        last: t.last,
      }
    })
    // biggest rivalries first: most games played, name as the stable tie-break
    .sort((a, b) => {
      const gamesOf = (r: H2hRow) =>
        r.games.split("–").reduce((sum, n) => sum + Number(n), 0)
      return gamesOf(b) - gamesOf(a) || a.rival.localeCompare(b.rival)
    })

  return { rows, read: buildRead(rows) }
}

function buildRead(rows: Array<H2hRow>): string {
  if (rows.length === 0) {
    return "Rivalries appear here once a match has a result."
  }
  const behind = rows.filter((r) => r.share < 50)
  if (behind.length > 0) {
    const toughest = behind.reduce((a, b) => (b.share < a.share ? b : a))
    return `${toughest.rival} is the problem — winning just ${toughest.share}% of the games there.`
  }
  const closest = rows.reduce((a, b) => (b.share < a.share ? b : a))
  return `Ahead of every rival — ${closest.rival} is the closest fight at ${closest.share}% of the games.`
}
