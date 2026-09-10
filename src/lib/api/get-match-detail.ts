import { queryOptions, useQuery } from "@tanstack/react-query"

import { MATCH_DETAIL_COLUMNS, matchDetail } from "@/lib/schemas/match"
import { RALLY_SUMMARY_COLUMNS } from "@/lib/schemas/rally"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { QueryConfig } from "@/lib/react-query"

export async function fetchMatchDetail(matchId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("matches")
    // explicit columns, not `*`: zod strips whatever the schemas do not
    // name, so the two stars were fetching updated_at on the match and
    // created_at/updated_at on every rally only to throw them away — two
    // extra timestamps per rally, on a view that loads every rally of a match
    .select(
      `${MATCH_DETAIL_COLUMNS}, games(id, game_number, rallies(${RALLY_SUMMARY_COLUMNS}))`
    )
    .eq("id", matchId)
    .single()
  if (error) throw error
  const parsed = matchDetail.parse(data)
  // PostgREST embedded ordering is unspecified — sort deterministically here.
  parsed.games.sort((a, b) => a.game_number - b.game_number)
  for (const game of parsed.games) {
    game.rallies.sort((a, b) => a.rally_number - b.rally_number)
  }
  return parsed
}

export const matchDetailQueryOptions = (matchId: string) =>
  queryOptions({
    queryKey: ["matches", "detail", matchId],
    queryFn: () => fetchMatchDetail(matchId),
  })

type UseMatchDetailOptions = {
  matchId: string
  queryConfig?: QueryConfig<typeof matchDetailQueryOptions>
}

export function useMatchDetail({
  matchId,
  queryConfig,
}: UseMatchDetailOptions) {
  return useQuery({ ...matchDetailQueryOptions(matchId), ...queryConfig })
}
