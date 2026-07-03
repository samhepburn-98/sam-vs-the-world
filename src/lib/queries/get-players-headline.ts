import { queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { rosterHeadline } from "@/lib/schemas/insights"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { RosterHeadline } from "@/lib/schemas/insights"

/** The home roster in one call — every player's headline, no per-card N+1. */
export async function fetchPlayersHeadline(): Promise<Array<RosterHeadline>> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("players_headline")
  if (error) throw error
  return z.array(rosterHeadline).parse(data)
}

export function playersHeadlineOptions() {
  return queryOptions({
    queryKey: ["insights", "players-headline"],
    queryFn: fetchPlayersHeadline,
  })
}

export function usePlayersHeadline() {
  return useQuery(playersHeadlineOptions())
}
