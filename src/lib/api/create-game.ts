import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { GameRef } from "@/lib/rally/write-intent"
import type { WriteOp } from "@/lib/api/write-queue"

interface InsertCapableClient {
  from: (table: "games") => {
    insert: (values: Record<string, unknown>) => PromiseLike<{ error: unknown }>
  }
}

/** Next-game insert as a queue op — id is the client uuid (idempotent retry). */
export function insertGameOp(
  game: GameRef,
  client: InsertCapableClient = getSupabaseBrowserClient(),
): WriteOp {
  return {
    id: game.id,
    label: `start game ${game.gameNumber}`,
    run: async () => {
      const { error } = await client.from("games").insert({
        id: game.id,
        match_id: game.matchId,
        game_number: game.gameNumber,
      })
      if (error) throw error
    },
  }
}
