import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import {
  classifyQuery,
  MANAGE_PAGE_SIZE,
  sanitizeSort,
} from "@/lib/queries/manage-list"
import { gameRow } from "@/lib/schemas/game"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { ListPage, ListParams } from "@/lib/queries/manage-list"
import type { GameRow } from "@/lib/schemas/game"

const SORTABLE = new Set(["game_number", "created_at", "updated_at"])

export async function fetchManageGames(
  params: ListParams,
): Promise<ListPage<GameRow>> {
  const supabase = getSupabaseBrowserClient()
  let query = supabase.from("games").select("*", { count: "exact" })

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
  return { rows: z.array(gameRow).parse(data), total: count ?? 0 }
}

export function useManageGames(params: ListParams) {
  return useQuery({
    queryKey: ["manage", "games", params],
    queryFn: () => fetchManageGames(params),
    placeholderData: keepPreviousData,
  })
}
