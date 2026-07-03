import { queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { matchResultSummary } from "@/lib/schemas/match"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

// The home hub's recent-matches list (§5.1): the derived result per match,
// newest first. Player names are resolved from the roster the page already
// holds, so this stays one lean read.

export async function fetchRecentResults() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("match_results")
    .select(
      "match_id, date, player1_id, player2_id, games_won_p1, games_won_p2, match_winner_id, ball_type",
    )
    .order("date", { ascending: false })
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
