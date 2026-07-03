import { queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { toRpcFilters } from "@/features/dashboard/api/get-player-headline"
import { rallyScored } from "@/lib/schemas/rally"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { InsightFilters } from "@/features/dashboard/schemas/insights"
import type { RallyScored } from "@/lib/schemas/rally"

/** The drill-through companion of serve_stats (§8.4): every decided rally
 *  the player served, filtered by the same SQL the aggregate used. */
export async function fetchServeRallies(
  playerId: string,
  filters: InsightFilters = {},
): Promise<Array<RallyScored>> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("serve_rallies", {
    p_player_id: playerId,
    ...toRpcFilters(filters),
  })
  if (error) throw error
  return z.array(rallyScored).parse(data)
}

export function serveRalliesOptions(
  playerId: string,
  filters: InsightFilters = {},
) {
  return queryOptions({
    queryKey: ["insights", "serve-rallies", playerId, filters],
    queryFn: () => fetchServeRallies(playerId, filters),
  })
}

export function useServeRallies(
  playerId: string,
  filters: InsightFilters = {},
) {
  return useQuery(serveRalliesOptions(playerId, filters))
}
