import { queryOptions, useQuery } from "@tanstack/react-query"

import { toRpcFilters } from "@/features/dashboard/api/rpc-filters"
import { playerInsights } from "@/features/dashboard/schemas/insights"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { PlayerData } from "@/features/dashboard/lib/player-attributes"
import type { InsightFilters } from "@/features/dashboard/schemas/insights"
import type { QueryConfig } from "@/lib/react-query"
import type { QueryClient } from "@tanstack/react-query"

// One player's six insight payloads in one request (§3). Each used to be its
// own round trip, so a profile cost six and the home page six per roster
// player on top of its own three.
//
// The six single-insight files stay: the category pages fetch one payload at
// a time and should not pull the other five. This is the shape for a surface
// that wants the whole player — the profile, the roster rows, the duel.

export async function fetchPlayerInsights(
  playerId: string,
  filters: InsightFilters = {}
): Promise<PlayerData> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("player_insights", {
    p_player_id: playerId,
    ...toRpcFilters(filters),
  })
  if (error) throw error
  const row = playerInsights.parse(data[0])
  // PlayerData names two of them differently from their SQL columns — `error`
  // and `rally` — so the mapping is spelled out rather than spread
  return {
    headline: row.headline,
    serve: row.serve,
    error: row.errors,
    rally: row.rally_lengths,
    momentum: row.momentum,
    decisive: row.decisive_shots,
  }
}

export function playerInsightsQueryOptions(
  playerId: string,
  filters: InsightFilters = {}
) {
  return queryOptions({
    queryKey: ["insights", "player-insights", playerId, filters],
    queryFn: () => fetchPlayerInsights(playerId, filters),
  })
}

/** Warm a player's insights into the cache — call it from a route loader so
 *  the cards come back in the server-rendered markup instead of painting in
 *  after hydration. */
export function prefetchPlayerInsights(
  queryClient: QueryClient,
  playerId: string,
  filters: InsightFilters = {}
): Promise<unknown> {
  return queryClient.ensureQueryData(
    playerInsightsQueryOptions(playerId, filters)
  )
}

type UsePlayerInsightsOptions = {
  /** undefined renders a slot that isn't picked yet; nothing fetches */
  playerId: string | undefined
  filters?: InsightFilters
  queryConfig?: QueryConfig<typeof playerInsightsQueryOptions>
}

/** The insight payloads behind one player's surface. Every field of
 *  PlayerData is optional, so consumers render what's in and dash what
 *  isn't — which is still true here, they now all arrive together. */
export function usePlayerInsights({
  playerId,
  filters = {},
  queryConfig,
}: UsePlayerInsightsOptions): PlayerData {
  const query = useQuery({
    ...playerInsightsQueryOptions(playerId ?? "", filters),
    enabled: Boolean(playerId),
    ...queryConfig,
  })
  return query.data ?? {}
}
