import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  newPlayerSchema,
  PLAYER_SUMMARY_COLUMNS,
  playerSummary,
} from "@/lib/schemas/player"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { NewPlayerInput } from "@/lib/schemas/player"

export function useCreatePlayer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (raw: NewPlayerInput) => {
      const input = newPlayerSchema.parse(raw)
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("players")
        .insert({ id: crypto.randomUUID(), name: input.name })
        .select(PLAYER_SUMMARY_COLUMNS)
        .single()
      if (error) throw error
      return playerSummary.parse(data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["players"] })
      // the roster headline is one RPC row per player — a new player adds one
      void queryClient.invalidateQueries({
        queryKey: ["insights", "players-headline"],
      })
    },
  })
}
