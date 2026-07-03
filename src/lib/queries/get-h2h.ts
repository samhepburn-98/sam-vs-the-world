import { queryOptions, useQuery } from "@tanstack/react-query"

import { toRpcFilters } from "@/lib/queries/get-player-headline"
import { h2hResult } from "@/lib/schemas/insights"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { H2hResult, InsightFilters } from "@/lib/schemas/insights"

/** The h2h filters are the cross-cutting set minus opponent — the second
 *  player IS the opponent. */
export type H2hFilters = Omit<InsightFilters, "opponentId">

export async function fetchH2h(
  player1Id: string,
  player2Id: string,
  filters: H2hFilters = {},
): Promise<H2hResult> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("h2h", {
    p_player1_id: player1Id,
    p_player2_id: player2Id,
    ...toRpcFilters(filters),
  })
  if (error) throw error
  return h2hResult.parse(data[0])
}

export function h2hOptions(
  player1Id: string,
  player2Id: string,
  filters: H2hFilters = {},
) {
  return queryOptions({
    queryKey: ["insights", "h2h", player1Id, player2Id, filters],
    queryFn: () => fetchH2h(player1Id, player2Id, filters),
  })
}

export function useH2h(
  player1Id: string,
  player2Id: string,
  filters: H2hFilters = {},
) {
  return useQuery(h2hOptions(player1Id, player2Id, filters))
}
