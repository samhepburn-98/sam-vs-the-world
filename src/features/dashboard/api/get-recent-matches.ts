import { queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { matchSummary } from "@/lib/schemas/match"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { QueryConfig } from "@/lib/react-query"

export async function fetchRecentMatches() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("matches")
    .select("id, date, player1_id, player2_id, venue, format, created_at")
    .order("created_at", { ascending: false })
    .limit(8)
  if (error) throw error
  return z.array(matchSummary).parse(data)
}

export const recentMatchesQueryOptions = () =>
  queryOptions({ queryKey: ["matches", "recent"], queryFn: fetchRecentMatches })

type UseRecentMatchesOptions = {
  queryConfig?: QueryConfig<typeof recentMatchesQueryOptions>
}

export function useRecentMatches({
  queryConfig,
}: UseRecentMatchesOptions = {}) {
  return useQuery({ ...recentMatchesQueryOptions(), ...queryConfig })
}
