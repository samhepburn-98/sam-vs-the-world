import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { Database } from "@/lib/database.types"
import type { MatchSetupInput } from "@/lib/schemas/match"

// Starting a match is one form submit, not rally logging: a single RPC that
// writes the match and its game 1 in one transaction (§1.8). It deliberately
// does NOT go through the write queue — the queue exists to keep the *rally
// sequence* in order during a session, and routing a one-off create through
// it bought nothing but failure states to unwind.

type CreateMatchArgs =
  Database["public"]["Functions"]["create_match_with_game"]["Args"]

/** the sliver of the Supabase client this needs, so tests can fake it */
interface RpcCapableClient {
  rpc: (
    fn: "create_match_with_game",
    args: CreateMatchArgs
  ) => PromiseLike<{ data: string | null; error: unknown }>
}

/** Returns the new match's id. Throws the Supabase error as-is — callers
 *  translate it (`friendlyWriteError`). */
export async function createMatchWithGame(
  input: MatchSetupInput,
  client: RpcCapableClient = getSupabaseBrowserClient()
): Promise<string> {
  const { data, error } = await client.rpc("create_match_with_game", {
    p_player1_id: input.player1Id,
    p_player2_id: input.player2Id,
    p_date: input.date,
    p_venue: input.venue?.length ? input.venue : null,
    p_format: input.houseRules.format,
    p_target_score: input.houseRules.targetScore,
    p_tiebreak: input.houseRules.tiebreak,
    p_serves_per_point: input.houseRules.servesPerPoint,
    p_let_resets_serve: input.houseRules.letResetsServe,
    p_ball_type: input.houseRules.ballType,
  })
  if (error) throw error
  if (data === null) throw new Error("create_match_with_game returned no id")
  return data
}
