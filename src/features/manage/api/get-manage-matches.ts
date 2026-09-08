import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import {
  classifyQuery,
  MANAGE_PAGE_SIZE,
  sanitizeSort,
} from "@/features/manage/api/manage-list"
import { matchRow } from "@/lib/schemas/match"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { ListPage, ListParams } from "@/features/manage/api/manage-list"
import type { QueryConfig } from "@/lib/react-query"
import type { MatchRow } from "@/lib/schemas/match"

const SORTABLE = new Set([
  "date",
  "venue",
  "format",
  "target_score",
  "created_at",
  "updated_at",
])

export async function fetchManageMatches(
  params: ListParams
): Promise<ListPage<MatchRow>> {
  const supabase = getSupabaseBrowserClient()
  let query = supabase.from("matches").select("*", { count: "exact" })

  const search = classifyQuery(params.q)
  if (search.kind === "uuid") query = query.eq("id", search.value)
  else if (search.kind === "text") {
    query = query.or(
      `venue.ilike.%${search.value}%,notes.ilike.%${search.value}%`
    )
  } else if (search.kind === "number") {
    query = query.eq("format", search.value)
  }

  const sort = sanitizeSort(params.sort, SORTABLE, "date")
  const from = (params.page - 1) * MANAGE_PAGE_SIZE
  const { data, error, count } = await query
    .order(sort.column, { ascending: sort.dir === "asc" })
    .order("id", { ascending: true }) // stable pagination tiebreak
    .range(from, from + MANAGE_PAGE_SIZE - 1)
  if (error) throw error
  return { rows: z.array(matchRow).parse(data), total: count ?? 0 }
}

export function manageMatchesQueryOptions(params: ListParams) {
  return queryOptions({
    queryKey: ["manage", "matches", params],
    queryFn: () => fetchManageMatches(params),
    placeholderData: keepPreviousData,
  })
}

type UseManageMatchesOptions = {
  params: ListParams
  queryConfig?: QueryConfig<typeof manageMatchesQueryOptions>
}

export function useManageMatches({
  params,
  queryConfig,
}: UseManageMatchesOptions) {
  return useQuery({ ...manageMatchesQueryOptions(params), ...queryConfig })
}
