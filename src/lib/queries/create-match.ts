import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { MatchSetupInput } from "@/lib/schemas/match"
import type { WriteOp } from "@/lib/queue/write-queue"

// Builds the write-queue ops for a new match: the match row commits before
// its game row (FIFO guarantees ordering, §8.3). Ids are client-generated so
// the logger can transition immediately and retries stay idempotent.

interface InsertCapableClient {
  from: (table: "matches" | "games") => {
    insert: (values: Record<string, unknown>) => PromiseLike<{ error: unknown }>
  }
}

export interface CreateMatchPlan {
  matchId: string
  gameId: string
  ops: Array<WriteOp>
}

export function planCreateMatch(
  input: MatchSetupInput,
  client: InsertCapableClient = getSupabaseBrowserClient(),
): CreateMatchPlan {
  const matchId = crypto.randomUUID()
  const gameId = crypto.randomUUID()

  const matchRow = {
    id: matchId,
    date: input.date,
    player1_id: input.player1Id,
    player2_id: input.player2Id,
    venue: input.venue?.length ? input.venue : null,
    format: input.houseRules.format,
    target_score: input.houseRules.targetScore,
    tiebreak: input.houseRules.tiebreak,
    serves_per_point: input.houseRules.servesPerPoint,
    let_resets_serve: input.houseRules.letResetsServe,
    ball_type: input.houseRules.ballType,
  }

  const gameRow = { id: gameId, match_id: matchId, game_number: 1 }

  const ops: Array<WriteOp> = [
    {
      id: matchId,
      label: "create match",
      run: async () => {
        const { error } = await client.from("matches").insert(matchRow)
        if (error) throw error
      },
    },
    {
      id: gameId,
      label: "create game 1",
      run: async () => {
        const { error } = await client.from("games").insert(gameRow)
        if (error) throw error
      },
    },
  ]

  return { matchId, gameId, ops }
}
