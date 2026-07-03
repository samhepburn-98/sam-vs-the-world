import { useMutation, useQueryClient } from "@tanstack/react-query"

import { newPlayerSchema, playerSummary } from "@/lib/schemas/player"
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
        .select("id, name, handedness")
        .single()
      if (error) throw error
      return playerSummary.parse(data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["players"] })
    },
  })
}
