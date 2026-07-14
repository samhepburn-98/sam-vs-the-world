import { queryOptions, useQuery } from "@tanstack/react-query"

import { MATCH_RESULT_COLUMNS, matchResultSummary } from "@/lib/schemas/match"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

// The derived verdict for one match. match_results owns who won — or that
// the match is drawn or still pending — so the detail header reads the view
// instead of recomputing the clinch rule it would inevitably drift from.

export async function fetchMatchResult(matchId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("match_results")
    .select(MATCH_RESULT_COLUMNS)
    .eq("match_id", matchId)
    .single()
  if (error) throw error
  return matchResultSummary.parse(data)
}

export const matchResultQueryOptions = (matchId: string) =>
  queryOptions({
    queryKey: ["matches", "result", matchId],
    queryFn: () => fetchMatchResult(matchId),
  })

export function useMatchResult(matchId: string) {
  return useQuery(matchResultQueryOptions(matchId))
}
