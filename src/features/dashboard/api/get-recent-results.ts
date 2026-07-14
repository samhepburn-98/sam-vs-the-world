import { queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { MATCH_RESULT_COLUMNS, matchResultSummary } from "@/lib/schemas/match"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

// The home hub's recent-matches list (§5.1): the derived result per match,
// most recently logged first. Ordered by created_at, not date — date is a
// DATE, so a whole evening's matches tie on it and which eight rows come
// back (and in what order) would be nondeterministic. Player names are
// resolved from the roster the page already holds, so this stays one lean
// read.

export async function fetchRecentResults() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("match_results")
    .select(MATCH_RESULT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(8)
  if (error) throw error
  return z.array(matchResultSummary).parse(data)
}

export const recentResultsQueryOptions = () =>
  queryOptions({
    queryKey: ["matches", "recent-results"],
    queryFn: fetchRecentResults,
  })

export function useRecentResults() {
  return useQuery(recentResultsQueryOptions())
}
