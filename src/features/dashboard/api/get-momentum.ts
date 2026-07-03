import { queryOptions, useQuery } from "@tanstack/react-query"

import { toRpcFilters } from "@/features/dashboard/api/get-player-headline"
import { momentum } from "@/features/dashboard/schemas/insights"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { InsightFilters, Momentum } from "@/features/dashboard/schemas/insights"

export async function fetchMomentum(
  playerId: string,
  filters: InsightFilters = {},
  deficit?: number,
): Promise<Momentum> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("momentum", {
    p_player_id: playerId,
    p_deficit: deficit,
    ...toRpcFilters(filters),
  })
  if (error) throw error
  return momentum.parse(data[0])
}

export function momentumOptions(
  playerId: string,
  filters: InsightFilters = {},
  deficit?: number,
) {
  return queryOptions({
    queryKey: ["insights", "momentum", playerId, filters, deficit ?? null],
    queryFn: () => fetchMomentum(playerId, filters, deficit),
  })
}

export function useMomentum(
  playerId: string,
  filters: InsightFilters = {},
  deficit?: number,
) {
  return useQuery(momentumOptions(playerId, filters, deficit))
}
