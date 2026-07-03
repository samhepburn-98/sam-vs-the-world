import { queryOptions, useQuery } from "@tanstack/react-query"

import { toRpcFilters } from "@/lib/queries/get-player-headline"
import { errorProfile } from "@/lib/schemas/insights"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { ErrorProfile, InsightFilters } from "@/lib/schemas/insights"

export async function fetchErrorProfile(
  playerId: string,
  filters: InsightFilters = {},
): Promise<ErrorProfile> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("error_profile", {
    p_player_id: playerId,
    ...toRpcFilters(filters),
  })
  if (error) throw error
  return errorProfile.parse(data[0])
}

export function errorProfileOptions(
  playerId: string,
  filters: InsightFilters = {},
) {
  return queryOptions({
    queryKey: ["insights", "error-profile", playerId, filters],
    queryFn: () => fetchErrorProfile(playerId, filters),
  })
}

export function useErrorProfile(
  playerId: string,
  filters: InsightFilters = {},
) {
  return useQuery(errorProfileOptions(playerId, filters))
}
