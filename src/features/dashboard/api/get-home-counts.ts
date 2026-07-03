import { queryOptions, useQuery } from "@tanstack/react-query"

import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

// The one headline figure on the hero (§5.1): "N rallies logged across M
// matches". Two exact head-counts — no rows fetched, just the totals.

export interface HomeCounts {
  rallies: number
  matches: number
}

export async function fetchHomeCounts(): Promise<HomeCounts> {
  const supabase = getSupabaseBrowserClient()
  const [rallies, matches] = await Promise.all([
    supabase.from("rallies").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
  ])
  if (rallies.error) throw rallies.error
  if (matches.error) throw matches.error
  return { rallies: rallies.count ?? 0, matches: matches.count ?? 0 }
}

export const homeCountsQueryOptions = () =>
  queryOptions({ queryKey: ["home", "counts"], queryFn: fetchHomeCounts })

export function useHomeCounts() {
  return useQuery(homeCountsQueryOptions())
}
