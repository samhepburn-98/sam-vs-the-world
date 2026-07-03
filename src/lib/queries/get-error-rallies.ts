import { queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { toRpcFilters } from "@/lib/queries/get-player-headline"
import { rallyScored } from "@/lib/schemas/rally"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { InsightFilters } from "@/lib/schemas/insights"
import type { RallyScored } from "@/lib/schemas/rally"

/** The drill-through companion of error_profile (§8.4): the error rows
 *  behind every count, filtered by the same SQL the aggregate used. */
export async function fetchErrorRallies(
  playerId: string,
  filters: InsightFilters = {},
): Promise<Array<RallyScored>> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("error_rallies", {
    p_player_id: playerId,
    ...toRpcFilters(filters),
  })
  if (error) throw error
  return z.array(rallyScored).parse(data)
}

export function errorRalliesOptions(
  playerId: string,
  filters: InsightFilters = {},
) {
  return queryOptions({
    queryKey: ["insights", "error-rallies", playerId, filters],
    queryFn: () => fetchErrorRallies(playerId, filters),
  })
}

export function useErrorRallies(
  playerId: string,
  filters: InsightFilters = {},
) {
  return useQuery(errorRalliesOptions(playerId, filters))
}
