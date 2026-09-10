import { houseRulesOf } from "@/features/logger/lib/match-detail"
import { currentGame } from "@/features/logger/lib/session"
import { rowToRallyInput } from "@/lib/rally/rally-draft"
import {
  gameOver,
  gameResult,
  suggestNextGameFirstServer,
  tallyMatch,
} from "@/lib/scoring"

import type { SessionState } from "@/features/logger/lib/session"
import type { DraftContext } from "@/lib/rally/rally-draft"
import type { MatchDetail } from "@/lib/schemas/match"
import type {
  GameContext,
  GameOver,
  GameResult,
  HouseRules,
  MatchTally,
} from "@/lib/scoring"

// Everything the logging surface reads off the session before it renders
// anything: which game is live, who serves its first rally, what the score
// is, whether the game is over, and where the match stands. All of it is a
// pure function of the session plus the match, so it is derived here rather
// than inline in the component — which is also what makes the serving rule
// below testable.

export interface PriorGame {
  n: number
  r: GameResult
}

export interface GameView {
  /** the game being logged into — the last one in the session */
  game: SessionState["games"][number]
  rules: HouseRules
  /** context for the match as a whole, anchored on its first server */
  baseCtx: GameContext
  /** context for the live game, anchored on whoever serves its first rally */
  gameCtx: GameContext
  draftCtx: DraftContext
  /** every completed game, with its result */
  priorGames: Array<PriorGame>
  inputs: ReturnType<typeof rowToRallyInput>[]
  result: GameResult
  score: GameResult["score"]
  /** whether the live game has reached its target under the house rules —
   *  a suggestion for the banner, never a gate (§7.7 tier 3) */
  over: GameOver
  tally: MatchTally
}

export function deriveGameView(
  session: SessionState,
  match: MatchDetail,
  /** the setup choice, for a fresh match whose rally 1 does not exist yet */
  firstServerId?: string
): GameView {
  const rules = houseRulesOf(match)
  const game = currentGame(session)

  // who serves the match's first rally: the stored fact wins, because real
  // serving can deviate from the rules and the DB records what happened
  // (decision 4). Only when there is no rally yet does the setup choice
  // apply, and only then does player one stand in as the last resort.
  const matchFirstServer =
    session.games[0].rows.at(0)?.server_id ?? firstServerId ?? match.player1_id

  const baseCtx: GameContext = {
    player1Id: match.player1_id,
    player2Id: match.player2_id,
    firstServerId: matchFirstServer,
    rules,
  }

  const priorGames: Array<PriorGame> = session.games.slice(0, -1).map((g) => ({
    n: g.gameNumber,
    r: gameResult(g.rows.map(rowToRallyInput), baseCtx),
  }))

  // and who serves THIS game's first rally: the stored fact again, else the
  // match's first server for game 1, else the previous game's winner (§7.2)
  const gameCtx: GameContext = {
    ...baseCtx,
    firstServerId:
      game.rows.at(0)?.server_id ??
      (game.gameNumber === 1
        ? matchFirstServer
        : suggestNextGameFirstServer(
            priorGames.at(-1)?.r.winnerId ?? null,
            baseCtx
          )),
  }

  const inputs = game.rows.map(rowToRallyInput)
  const result = gameResult(inputs, gameCtx)

  return {
    game,
    rules,
    baseCtx,
    gameCtx,
    draftCtx: {
      player1Id: match.player1_id,
      player2Id: match.player2_id,
      rules,
    },
    priorGames,
    inputs,
    result,
    score: result.score,
    over: gameOver(result.score, rules),
    tally: tallyMatch([...priorGames.map((g) => g.r), result], {
      player1Id: match.player1_id,
      player2Id: match.player2_id,
      format: match.format,
    }),
  }
}
