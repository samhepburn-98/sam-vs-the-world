import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import {
  classifyQuery,
  MANAGE_PAGE_SIZE,
  sanitizeSort,
} from "@/lib/queries/manage-list"
import { playerRow } from "@/lib/schemas/player"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { ListPage, ListParams } from "@/lib/queries/manage-list"
import type { PlayerRow } from "@/lib/schemas/player"

const SORTABLE = new Set(["name", "handedness", "created_at", "updated_at"])

export async function fetchManagePlayers(
  params: ListParams,
): Promise<ListPage<PlayerRow>> {
  const supabase = getSupabaseBrowserClient()
  let query = supabase.from("players").select("*", { count: "exact" })

  const search = classifyQuery(params.q)
  if (search.kind === "uuid") query = query.eq("id", search.value)
  else if (search.kind === "text" || search.kind === "number") {
    query = query.ilike("name", `%${String(search.value)}%`)
  }

  const sort = sanitizeSort(params.sort, SORTABLE, "name")
  const from = (params.page - 1) * MANAGE_PAGE_SIZE
  const { data, error, count } = await query
    .order(sort.column, { ascending: sort.dir === "asc" })
    .order("id", { ascending: true }) // stable pagination tiebreak
    .range(from, from + MANAGE_PAGE_SIZE - 1)
  if (error) throw error
  return { rows: z.array(playerRow).parse(data), total: count ?? 0 }
}

export function useManagePlayers(params: ListParams) {
  return useQuery({
    queryKey: ["manage", "players", params],
    queryFn: () => fetchManagePlayers(params),
    placeholderData: keepPreviousData,
  })
}
