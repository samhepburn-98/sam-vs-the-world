import { queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { playerSummary } from "@/lib/schemas/player"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

export async function fetchPlayers() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("players")
    .select("id, name, handedness, avatar_url")
    .order("name")
  if (error) throw error
  return z.array(playerSummary).parse(data)
}

export const playersQueryOptions = () =>
  queryOptions({ queryKey: ["players"], queryFn: fetchPlayers })

export function usePlayers() {
  return useQuery(playersQueryOptions())
}
