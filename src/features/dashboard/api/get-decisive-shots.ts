import { queryOptions, useQuery } from "@tanstack/react-query"

import { toRpcFilters } from "@/features/dashboard/api/get-player-headline"
import { decisiveShots } from "@/features/dashboard/schemas/insights"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type {
  DecisiveShots,
  InsightFilters,
} from "@/features/dashboard/schemas/insights"

// decisive_shots(...) — the winning/losing shot breakdown behind the
// Point-enders card, same filter contract as the other insight RPCs.

export async function fetchDecisiveShots(
  playerId: string,
  filters: InsightFilters = {}
): Promise<DecisiveShots> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("decisive_shots", {
    p_player_id: playerId,
    ...toRpcFilters(filters),
  })
  if (error) throw error
  return decisiveShots.parse(data[0])
}

export function decisiveShotsOptions(
  playerId: string,
  filters: InsightFilters = {}
) {
  return queryOptions({
    queryKey: ["insights", "decisive-shots", playerId, filters],
    queryFn: () => fetchDecisiveShots(playerId, filters),
  })
}

export function useDecisiveShots(
  playerId: string,
  filters: InsightFilters = {}
) {
  return useQuery(decisiveShotsOptions(playerId, filters))
}
