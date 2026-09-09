import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import {
  classifyQuery,
  MANAGE_PAGE_SIZE,
  sanitizeSort,
} from "@/features/manage/api/manage-list"
import { gameResultRow, gameRowWithMatch } from "@/lib/schemas/game"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { ListPage, ListParams } from "@/features/manage/api/manage-list"
import type { QueryConfig } from "@/lib/react-query"
import type { GameBrowserRow } from "@/lib/schemas/game"

const SORTABLE = new Set(["game_number", "created_at", "updated_at"])

export async function fetchManageGames(
  params: ListParams
): Promise<ListPage<GameBrowserRow>> {
  const supabase = getSupabaseBrowserClient()
  let query = supabase
    .from("games")
    .select("*, matches(date, player1_id, player2_id)", { count: "exact" })

  const search = classifyQuery(params.q)
  if (search.kind === "uuid") {
    // a pasted id finds the game itself OR a match's games (relation hop)
    query = query.or(`id.eq.${search.value},match_id.eq.${search.value}`)
  } else if (search.kind === "number") {
    query = query.eq("game_number", search.value)
  } else if (search.kind === "text") {
    return { rows: [], total: 0 } // games have no text columns
  }

  const sort = sanitizeSort(params.sort, SORTABLE, "created_at")
  const from = (params.page - 1) * MANAGE_PAGE_SIZE
  const { data, error, count } = await query
    .order(sort.column, { ascending: sort.dir === "asc" })
    .order("id", { ascending: true }) // stable pagination tiebreak
    .range(from, from + MANAGE_PAGE_SIZE - 1)
  if (error) throw error
  const rows = z.array(gameRowWithMatch).parse(data)

  // the derived score/winner for this page's games (game_results view) —
  // a game with no rallies has no row there and renders as "no rallies yet"
  const results = new Map<string, GameBrowserRow["result"]>()
  if (rows.length > 0) {
    const derived = await supabase
      .from("game_results")
      .select("game_id, score_p1, score_p2, winner_id, is_undecided")
      .in(
        "game_id",
        rows.map((r) => r.id)
      )
    if (derived.error) throw derived.error
    for (const r of z.array(gameResultRow).parse(derived.data)) {
      results.set(r.game_id, r)
    }
  }

  return {
    rows: rows.map((r) => ({ ...r, result: results.get(r.id) ?? null })),
    total: count ?? 0,
  }
}

export function manageGamesQueryOptions(params: ListParams) {
  return queryOptions({
    queryKey: ["manage", "games", params],
    queryFn: () => fetchManageGames(params),
    placeholderData: keepPreviousData,
  })
}

type UseManageGamesOptions = {
  params: ListParams
  queryConfig?: QueryConfig<typeof manageGamesQueryOptions>
}

export function useManageGames({ params, queryConfig }: UseManageGamesOptions) {
  return useQuery({ ...manageGamesQueryOptions(params), ...queryConfig })
}
