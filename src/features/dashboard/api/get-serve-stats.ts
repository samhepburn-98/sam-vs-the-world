import { queryOptions, useQuery } from "@tanstack/react-query"

import { toRpcFilters } from "@/features/dashboard/api/rpc-filters"
import { serveStats } from "@/features/dashboard/schemas/insights"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type {
  InsightFilters,
  ServeStats,
} from "@/features/dashboard/schemas/insights"
import type { QueryConfig } from "@/lib/react-query"

export async function fetchServeStats(
  playerId: string,
  filters: InsightFilters = {}
): Promise<ServeStats> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("serve_stats", {
    p_player_id: playerId,
    ...toRpcFilters(filters),
  })
  if (error) throw error
  return serveStats.parse(data[0])
}

export function serveStatsQueryOptions(
  playerId: string,
  filters: InsightFilters = {}
) {
  return queryOptions({
    queryKey: ["insights", "serve-stats", playerId, filters],
    queryFn: () => fetchServeStats(playerId, filters),
  })
}

type UseServeStatsOptions = {
  playerId: string
  filters?: InsightFilters
  queryConfig?: QueryConfig<typeof serveStatsQueryOptions>
}

export function useServeStats({
  playerId,
  filters = {},
  queryConfig,
}: UseServeStatsOptions) {
  return useQuery({
    ...serveStatsQueryOptions(playerId, filters),
    ...queryConfig,
  })
}
