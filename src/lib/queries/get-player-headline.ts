import { queryOptions, useQuery } from "@tanstack/react-query"

import { playerHeadline } from "@/lib/schemas/insights"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { InsightFilters, PlayerHeadline } from "@/lib/schemas/insights"

/** Maps the client-side filter object onto the RPC's p_* parameters —
 *  omitted filters fall through to the SQL defaults (no filter). */
export function toRpcFilters(filters: InsightFilters) {
  return {
    p_opponent_id: filters.opponentId ?? undefined,
    p_ball_type: filters.ballType ?? undefined,
    p_date_from: filters.dateFrom ?? undefined,
    p_date_to: filters.dateTo ?? undefined,
  }
}

export async function fetchPlayerHeadline(
  playerId: string,
  filters: InsightFilters = {},
): Promise<PlayerHeadline> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("player_headline", {
    p_player_id: playerId,
    ...toRpcFilters(filters),
  })
  if (error) throw error
  return playerHeadline.parse(data[0])
}

export function playerHeadlineOptions(
  playerId: string,
  filters: InsightFilters = {},
) {
  return queryOptions({
    queryKey: ["insights", "player-headline", playerId, filters],
    queryFn: () => fetchPlayerHeadline(playerId, filters),
  })
}

export function usePlayerHeadline(
  playerId: string,
  filters: InsightFilters = {},
) {
  return useQuery(playerHeadlineOptions(playerId, filters))
}
