import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { Constants } from "@/lib/database.types"
import {
  classifyQuery,
  MANAGE_PAGE_SIZE,
  sanitizeSort,
} from "@/lib/queries/manage-list"
import { rallyDbRowWithGame } from "@/lib/schemas/rally"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { ListPage, ListParams } from "@/lib/queries/manage-list"
import type { RallyDbRowWithGame } from "@/lib/schemas/rally"

const SORTABLE = new Set([
  "rally_number",
  "serve_number",
  "end_reason",
  "shot_count",
  "created_at",
  "updated_at",
])

const END_REASONS = new Set<string>(Constants.public.Enums.end_reason)

export async function fetchManageRallies(
  params: ListParams,
): Promise<ListPage<RallyDbRowWithGame>> {
  const supabase = getSupabaseBrowserClient()
  let query = supabase.from("rallies").select("*, games(game_number, matches(date, player1_id, player2_id))", { count: "exact" })

  const search = classifyQuery(params.q)
  if (search.kind === "uuid") {
    // a pasted id finds the rally, a game's rallies, or a player's rallies
    query = query.or(
      `id.eq.${search.value},game_id.eq.${search.value},server_id.eq.${search.value},winner_id.eq.${search.value}`,
    )
  } else if (search.kind === "number") {
    query = query.eq("rally_number", search.value)
  } else if (search.kind === "text") {
    const wanted = search.value.toLowerCase().replace(" ", "_")
    if (!END_REASONS.has(wanted)) return { rows: [], total: 0 }
    query = query.eq(
      "end_reason",
      wanted as (typeof Constants.public.Enums.end_reason)[number],
    )
  }

  const sort = sanitizeSort(params.sort, SORTABLE, "created_at")
  const from = (params.page - 1) * MANAGE_PAGE_SIZE
  const { data, error, count } = await query
    .order(sort.column, { ascending: sort.dir === "asc" })
    .order("id", { ascending: true }) // stable pagination tiebreak
    .range(from, from + MANAGE_PAGE_SIZE - 1)
  if (error) throw error
  return { rows: z.array(rallyDbRowWithGame).parse(data), total: count ?? 0 }
}

export function useManageRallies(params: ListParams) {
  return useQuery({
    queryKey: ["manage", "rallies", params],
    queryFn: () => fetchManageRallies(params),
    placeholderData: keepPreviousData,
  })
}
