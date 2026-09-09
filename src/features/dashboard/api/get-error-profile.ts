import { queryOptions, useQuery } from "@tanstack/react-query"

import { toRpcFilters } from "@/features/dashboard/api/rpc-filters"
import { errorProfile } from "@/features/dashboard/schemas/insights"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type {
  ErrorProfile,
  InsightFilters,
} from "@/features/dashboard/schemas/insights"
import type { QueryConfig } from "@/lib/react-query"

export async function fetchErrorProfile(
  playerId: string,
  filters: InsightFilters = {}
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
  filters: InsightFilters = {}
) {
  return queryOptions({
    queryKey: ["insights", "error-profile", playerId, filters],
    queryFn: () => fetchErrorProfile(playerId, filters),
  })
}

type UseErrorProfileOptions = {
  playerId: string
  filters?: InsightFilters
  queryConfig?: QueryConfig<typeof errorProfileOptions>
}

export function useErrorProfile({
  playerId,
  filters = {},
  queryConfig,
}: UseErrorProfileOptions) {
  return useQuery({ ...errorProfileOptions(playerId, filters), ...queryConfig })
}
