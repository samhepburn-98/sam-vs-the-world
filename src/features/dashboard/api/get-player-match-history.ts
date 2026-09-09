import { queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { fetchMatches } from "@/features/dashboard/api/get-matches"
import { gameResultInMatch } from "@/lib/schemas/game"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { GameResultInMatch } from "@/lib/schemas/game"
import type { MatchListRow } from "@/lib/schemas/match"
import type { QueryConfig } from "@/lib/react-query"

// The profile's match history: the player's latest matches from
// `match_results` (one page, newest first, with the true total) plus every
// game score for those matches from `game_results` in a single .in() read.
// Names resolve from the roster the page already holds.

export const HISTORY_LIMIT = 8

export interface PlayerMatchHistoryData {
  matches: Array<MatchListRow>
  games: Array<GameResultInMatch>
  /** every match the player has, not just this page — drives the fold link */
  total: number
}

export async function fetchPlayerMatchHistory(
  playerId: string
): Promise<PlayerMatchHistoryData> {
  const page = await fetchMatches({ player: playerId, page: 1 })
  const matches = page.rows.slice(0, HISTORY_LIMIT)
  if (matches.length === 0) {
    return { matches, games: [], total: page.total }
  }

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("game_results")
    .select(
      "game_id, match_id, game_number, score_p1, score_p2, winner_id, is_undecided"
    )
    .in(
      "match_id",
      matches.map((m) => m.match_id)
    )
  if (error) throw error
  return {
    matches,
    games: z.array(gameResultInMatch).parse(data),
    total: page.total,
  }
}

export const playerMatchHistoryQueryOptions = (playerId: string) =>
  queryOptions({
    queryKey: ["matches", "player-history", playerId],
    queryFn: () => fetchPlayerMatchHistory(playerId),
  })

type UsePlayerMatchHistoryOptions = {
  playerId: string
  queryConfig?: QueryConfig<typeof playerMatchHistoryQueryOptions>
}

export function usePlayerMatchHistory({
  playerId,
  queryConfig,
}: UsePlayerMatchHistoryOptions) {
  return useQuery({
    ...playerMatchHistoryQueryOptions(playerId),
    ...queryConfig,
  })
}
