import { queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { toRpcFilters } from "@/features/dashboard/api/get-player-headline"
import { rallyScored } from "@/lib/schemas/rally"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { InsightFilters } from "@/features/dashboard/schemas/insights"
import type { RallyScored } from "@/lib/schemas/rally"

/** The drill-through companion of momentum (§8.4): every rally of the
 *  player's comeback games, so each can draw its own momentum chart. Same
 *  comeback logic as the aggregate. */
export async function fetchComebackRallies(
  playerId: string,
  filters: InsightFilters = {},
  deficit?: number
): Promise<Array<RallyScored>> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("comeback_rallies", {
    p_player_id: playerId,
    p_deficit: deficit,
    ...toRpcFilters(filters),
  })
  if (error) throw error
  return z.array(rallyScored).parse(data)
}

export function comebackRalliesOptions(
  playerId: string,
  filters: InsightFilters = {},
  deficit?: number
) {
  return queryOptions({
    queryKey: [
      "insights",
      "comeback-rallies",
      playerId,
      filters,
      deficit ?? null,
    ],
    queryFn: () => fetchComebackRallies(playerId, filters, deficit),
  })
}

export function useComebackRallies(
  playerId: string,
  filters: InsightFilters = {},
  deficit?: number
) {
  return useQuery(comebackRalliesOptions(playerId, filters, deficit))
}
