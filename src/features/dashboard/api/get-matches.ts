import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { MATCH_LIST_COLUMNS, matchListRow } from "@/lib/schemas/match"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { BallType } from "@/lib/schemas/enums"
import type { MatchListRow } from "@/lib/schemas/match"
import type { QueryConfig } from "@/lib/react-query"

// The match history list (§5.2): every match newest first, filterable by
// participant, ball, and date, paged. From `match_results` — names resolved
// from the roster the page already holds.

export const MATCHES_PAGE_SIZE = 20

export interface MatchesParams {
  player?: string
  ball?: BallType
  from?: string
  to?: string
  page: number
}

export interface MatchesPage {
  rows: Array<MatchListRow>
  total: number
}

export async function fetchMatches(
  params: MatchesParams
): Promise<MatchesPage> {
  const supabase = getSupabaseBrowserClient()
  let query = supabase
    .from("match_results")
    .select(MATCH_LIST_COLUMNS, { count: "exact" })

  if (params.player) {
    query = query.or(
      `player1_id.eq.${params.player},player2_id.eq.${params.player}`
    )
  }
  if (params.ball) query = query.eq("ball_type", params.ball)
  if (params.from) query = query.gte("date", params.from)
  if (params.to) query = query.lte("date", params.to)

  const from = (params.page - 1) * MATCHES_PAGE_SIZE
  const { data, error, count } = await query
    .order("date", { ascending: false })
    .order("match_id", { ascending: true })
    .range(from, from + MATCHES_PAGE_SIZE - 1)
  if (error) throw error
  return { rows: z.array(matchListRow).parse(data), total: count ?? 0 }
}

export function matchesQueryOptions(params: MatchesParams) {
  return queryOptions({
    queryKey: ["matches", "list", params],
    queryFn: () => fetchMatches(params),
    placeholderData: keepPreviousData,
  })
}

type UseMatchesOptions = {
  params: MatchesParams
  queryConfig?: QueryConfig<typeof matchesQueryOptions>
}

export function useMatches({ params, queryConfig }: UseMatchesOptions) {
  return useQuery({ ...matchesQueryOptions(params), ...queryConfig })
}
