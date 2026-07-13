import type { MatchResultSummary } from "@/lib/schemas/match"

// Head-to-head per rival, aggregated from the player's full match_results
// history — computeProfileShape's sibling for the Stats tab's rivalry table.
// Records count decided matches and games only; an in-play match adds no
// row to anyone's ledger. The read line is canned copy with the numbers
// dropped in, picked by the shape of the rivalries: the toughest rival when
// one is ahead of you, the closest fight when nobody is.

export interface H2hRow {
  rival: string
  /** Decided-match record, player first — "3–2". */
  matches: string
  /** Game record, player first — "10–8". */
  games: string
  /** Games won share, 0–100. */
  share: number
  lastWon: boolean
}

export interface H2hData {
  rows: Array<H2hRow>
  read: string
}

interface Tally {
  rivalId: string
  matchesWon: number
  matchesLost: number
  gamesWon: number
  gamesLost: number
  /** Win/loss of the newest decided match (input arrives newest first). */
  lastWon: boolean | null
}

export function computeH2h(
  playerId: string,
  matches: Array<MatchResultSummary>,
  nameOf: (id: string) => string
): H2hData {
  const tallies = new Map<string, Tally>()

  // newest first, so the first decided result per rival is "last"
  const sorted = [...matches].sort((a, b) => b.date.localeCompare(a.date))
  for (const m of sorted) {
    const isP1 = m.player1_id === playerId
    const rivalId = isP1 ? m.player2_id : m.player1_id
    const tally = tallies.get(rivalId) ?? {
      rivalId,
      matchesWon: 0,
      matchesLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      lastWon: null,
    }
    tally.gamesWon += (isP1 ? m.games_won_p1 : m.games_won_p2) ?? 0
    tally.gamesLost += (isP1 ? m.games_won_p2 : m.games_won_p1) ?? 0
    if (m.match_winner_id !== null) {
      const won = m.match_winner_id === playerId
      if (won) tally.matchesWon += 1
      else tally.matchesLost += 1
      if (tally.lastWon === null) tally.lastWon = won
    }
    tallies.set(rivalId, tally)
  }

  const rows = [...tallies.values()]
    .filter((t) => t.lastWon !== null) // no decided match yet — no ledger row
    .map((t) => {
      const games = t.gamesWon + t.gamesLost
      return {
        rival: nameOf(t.rivalId),
        matches: `${t.matchesWon}–${t.matchesLost}`,
        games: `${t.gamesWon}–${t.gamesLost}`,
        share: games > 0 ? Math.round((t.gamesWon / games) * 100) : 0,
        lastWon: t.lastWon === true,
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
    return "Rivalries appear here after the first decided match."
  }
  const behind = rows.filter((r) => r.share < 50)
  if (behind.length > 0) {
    const toughest = behind.reduce((a, b) => (b.share < a.share ? b : a))
    return `${toughest.rival} is the problem — winning just ${toughest.share}% of the games there.`
  }
  const closest = rows.reduce((a, b) => (b.share < a.share ? b : a))
  return `Ahead of every rival — ${closest.rival} is the closest fight at ${closest.share}% of the games.`
}
