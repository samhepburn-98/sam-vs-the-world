import { queryOptions, useQuery } from "@tanstack/react-query"

import { toRpcFilters } from "@/features/dashboard/api/get-player-headline"
import { serveStats } from "@/features/dashboard/schemas/insights"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { InsightFilters, ServeStats } from "@/features/dashboard/schemas/insights"

export async function fetchServeStats(
  playerId: string,
  filters: InsightFilters = {},
): Promise<ServeStats> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("serve_stats", {
    p_player_id: playerId,
    ...toRpcFilters(filters),
  })
  if (error) throw error
  return serveStats.parse(data[0])
}

export function serveStatsOptions(
  playerId: string,
  filters: InsightFilters = {},
) {
  return queryOptions({
    queryKey: ["insights", "serve-stats", playerId, filters],
    queryFn: () => fetchServeStats(playerId, filters),
  })
}

export function useServeStats(playerId: string, filters: InsightFilters = {}) {
  return useQuery(serveStatsOptions(playerId, filters))
}
