import { queryOptions, useQuery } from "@tanstack/react-query"

import { toRpcFilters } from "@/features/dashboard/api/rpc-filters"
import { playerHeadline } from "@/features/dashboard/schemas/insights"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type {
  InsightFilters,
  PlayerHeadline,
} from "@/features/dashboard/schemas/insights"
import type { QueryConfig } from "@/lib/react-query"

export async function fetchPlayerHeadline(
  playerId: string,
  filters: InsightFilters = {}
): Promise<PlayerHeadline> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("player_headline", {
    p_player_id: playerId,
    ...toRpcFilters(filters),
  })
  if (error) throw error
  return playerHeadline.parse(data[0])
}

export function playerHeadlineQueryOptions(
  playerId: string,
  filters: InsightFilters = {}
) {
  return queryOptions({
    queryKey: ["insights", "player-headline", playerId, filters],
    queryFn: () => fetchPlayerHeadline(playerId, filters),
  })
}

type UsePlayerHeadlineOptions = {
  playerId: string
  filters?: InsightFilters
  queryConfig?: QueryConfig<typeof playerHeadlineQueryOptions>
}

export function usePlayerHeadline({
  playerId,
  filters = {},
  queryConfig,
}: UsePlayerHeadlineOptions) {
  return useQuery({
    ...playerHeadlineQueryOptions(playerId, filters),
    ...queryConfig,
  })
}
