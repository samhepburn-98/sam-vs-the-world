import { queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { MATCH_RESULT_COLUMNS, matchResultSummary } from "@/lib/schemas/match"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { MatchResultSummary } from "@/lib/schemas/match"
import type { QueryConfig } from "@/lib/react-query"

// Every match result the player has, for the head-to-head aggregate. The
// match list API pages at 20 for its table; a rivalry record built from one
// page would silently drop the oldest matches, so this read is deliberately
// unpaged — one row per match is small for years to come.

export async function fetchPlayerH2h(
  playerId: string
): Promise<Array<MatchResultSummary>> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("match_results")
    .select(MATCH_RESULT_COLUMNS)
    .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
    .order("date", { ascending: false })
    .order("match_id", { ascending: true })
  if (error) throw error
  return z.array(matchResultSummary).parse(data)
}

export const playerH2hQueryOptions = (playerId: string) =>
  queryOptions({
    queryKey: ["matches", "player-h2h", playerId],
    queryFn: () => fetchPlayerH2h(playerId),
  })

type UsePlayerH2hOptions = {
  playerId: string
  queryConfig?: QueryConfig<typeof playerH2hQueryOptions>
}

export function usePlayerH2h({ playerId, queryConfig }: UsePlayerH2hOptions) {
  return useQuery({ ...playerH2hQueryOptions(playerId), ...queryConfig })
}
