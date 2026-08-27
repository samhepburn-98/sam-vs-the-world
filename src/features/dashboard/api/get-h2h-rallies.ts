import { queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { toRpcFilters } from "@/features/dashboard/api/get-player-headline"
import { rallyScored } from "@/lib/schemas/rally"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { H2hFilters } from "@/features/dashboard/api/get-h2h"
import type { RallyScored } from "@/lib/schemas/rally"

/** The drill-through companion of h2h (§8.4): the rally rows behind the
 *  numbers, filtered by the same SQL the aggregate used. */
export async function fetchH2hRallies(
  player1Id: string,
  player2Id: string,
  filters: H2hFilters = {}
): Promise<Array<RallyScored>> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("h2h_rallies", {
    p_player1_id: player1Id,
    p_player2_id: player2Id,
    ...toRpcFilters(filters),
  })
  if (error) throw error
  return z.array(rallyScored).parse(data)
}

export function h2hRalliesOptions(
  player1Id: string,
  player2Id: string,
  filters: H2hFilters = {}
) {
  return queryOptions({
    queryKey: ["insights", "h2h-rallies", player1Id, player2Id, filters],
    queryFn: () => fetchH2hRallies(player1Id, player2Id, filters),
  })
}

export function useH2hRallies(
  player1Id: string,
  player2Id: string,
  filters: H2hFilters = {},
  /** The compare panel opens this drill-through on demand: a pair's whole
   *  rally history is a lot to fetch for a panel most visits never expand. */
  enabled = true
) {
  return useQuery({
    ...h2hRalliesOptions(player1Id, player2Id, filters),
    enabled,
  })
}
