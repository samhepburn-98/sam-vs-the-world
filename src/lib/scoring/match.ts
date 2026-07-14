import type { GameResult } from "./types"

// Mirrors match_results: only decided games count; best-of clinches at
// floor(format/2)+1; casual (null format) is a simple majority; null = no
// winner (tie or nobody clinched).

export interface MatchTally {
  gamesWonP1: number
  gamesWonP2: number
  matchWinnerId: string | null
}

export function tallyMatch(
  games: ReadonlyArray<GameResult>,
  ctx: { player1Id: string; player2Id: string; format: number | null }
): MatchTally {
  let gamesWonP1 = 0
  let gamesWonP2 = 0
  for (const g of games) {
    if (g.winnerId === ctx.player1Id) gamesWonP1++
    else if (g.winnerId === ctx.player2Id) gamesWonP2++
  }

  let matchWinnerId: string | null = null
  if (ctx.format !== null) {
    const needed = Math.floor(ctx.format / 2) + 1
    if (gamesWonP1 >= needed) matchWinnerId = ctx.player1Id
    else if (gamesWonP2 >= needed) matchWinnerId = ctx.player2Id
  } else if (gamesWonP1 > gamesWonP2) {
    matchWinnerId = ctx.player1Id
  } else if (gamesWonP2 > gamesWonP1) {
    matchWinnerId = ctx.player2Id
  }

  return { gamesWonP1, gamesWonP2, matchWinnerId }
}
