import { queryOptions, useQuery } from "@tanstack/react-query"

import { matchDetail } from "@/lib/schemas/match"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

export async function fetchMatchDetail(matchId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("matches")
    .select("*, games(id, game_number, rallies(*))")
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

export function useMatchDetail(matchId: string) {
  return useQuery(matchDetailQueryOptions(matchId))
}
