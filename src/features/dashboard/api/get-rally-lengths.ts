import { queryOptions, useQuery } from "@tanstack/react-query"

import { toRpcFilters } from "@/features/dashboard/api/get-player-headline"
import { rallyLengths } from "@/features/dashboard/schemas/insights"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { InsightFilters, RallyLengths } from "@/features/dashboard/schemas/insights"

export async function fetchRallyLengths(
  playerId: string,
  filters: InsightFilters = {},
): Promise<RallyLengths> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("rally_lengths", {
    p_player_id: playerId,
    ...toRpcFilters(filters),
  })
  if (error) throw error
  return rallyLengths.parse(data[0])
}

export function rallyLengthsOptions(
  playerId: string,
  filters: InsightFilters = {},
) {
  return queryOptions({
    queryKey: ["insights", "rally-lengths", playerId, filters],
    queryFn: () => fetchRallyLengths(playerId, filters),
  })
}

export function useRallyLengths(
  playerId: string,
  filters: InsightFilters = {},
) {
  return useQuery(rallyLengthsOptions(playerId, filters))
}
