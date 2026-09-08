import { queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { toRpcFilters } from "@/features/dashboard/api/get-player-headline"
import { rallyScored } from "@/lib/schemas/rally"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type {
  InsightFilters,
  LengthBucket,
} from "@/features/dashboard/schemas/insights"
import type { RallyScored } from "@/lib/schemas/rally"
import type { QueryConfig } from "@/lib/react-query"

/** The drill-through companion of rally_lengths (§8.4): the rallies in one
 *  length bucket (undefined = every counted rally), same SQL as the aggregate. */
export async function fetchRallyLengthRallies(
  playerId: string,
  bucket: LengthBucket | null,
  filters: InsightFilters = {}
): Promise<Array<RallyScored>> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("rally_length_rallies", {
    p_player_id: playerId,
    p_bucket: bucket ?? undefined,
    ...toRpcFilters(filters),
  })
  if (error) throw error
  return z.array(rallyScored).parse(data)
}

export function rallyLengthRalliesOptions(
  playerId: string,
  bucket: LengthBucket | null,
  filters: InsightFilters = {}
) {
  return queryOptions({
    queryKey: ["insights", "rally-length-rallies", playerId, bucket, filters],
    queryFn: () => fetchRallyLengthRallies(playerId, bucket, filters),
  })
}

type UseRallyLengthRalliesOptions = {
  playerId: string
  bucket: LengthBucket | null
  filters?: InsightFilters
  queryConfig?: QueryConfig<typeof rallyLengthRalliesOptions>
}

export function useRallyLengthRallies({
  playerId,
  bucket,
  filters = {},
  queryConfig,
}: UseRallyLengthRalliesOptions) {
  return useQuery({
    ...rallyLengthRalliesOptions(playerId, bucket, filters),
    ...queryConfig,
  })
}
