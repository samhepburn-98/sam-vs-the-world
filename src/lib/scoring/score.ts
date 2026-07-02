import type { GameContext, GameResult, RallyInput, Score } from "./types"

// Mirrors rallies_scored: a windowed count of rally wins per player, where a
// let contributes to neither side and so carries the prior score.

export function runningScores(
  rallies: ReadonlyArray<RallyInput>,
  ctx: Pick<GameContext, "player1Id" | "player2Id">,
): Array<Score> {
  const scores: Array<Score> = []
  let p1 = 0
  let p2 = 0
  for (const rally of rallies) {
    if (rally.winnerId === ctx.player1Id) p1++
    else if (rally.winnerId === ctx.player2Id) p2++
    scores.push({ p1, p2 })
  }
  return scores
}

export function scoreAfter(
  rallies: ReadonlyArray<RallyInput>,
  ctx: Pick<GameContext, "player1Id" | "player2Id">,
): Score {
  const all = runningScores(rallies, ctx)
  return all.length > 0 ? all[all.length - 1] : { p1: 0, p2: 0 }
}

// Mirrors game_results: winner = whoever leads at the last rally actually
// played — deliberately rule-agnostic (§7.1).
export function gameResult(
  rallies: ReadonlyArray<RallyInput>,
  ctx: Pick<GameContext, "player1Id" | "player2Id">,
): GameResult {
  const score = scoreAfter(rallies, ctx)
  const winnerId =
    score.p1 > score.p2
      ? ctx.player1Id
      : score.p2 > score.p1
        ? ctx.player2Id
        : null
  return { score, winnerId, undecided: score.p1 === score.p2 }
}
