import { useMutation, useQueryClient } from "@tanstack/react-query"

import { gameEditSchema } from "@/lib/schemas/game"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { GameEditInput } from "@/lib/schemas/game"

export function useUpdateGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...raw }: GameEditInput & { id: string }) => {
      const input = gameEditSchema.parse(raw)
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from("games")
        .update({ game_number: input.gameNumber })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["manage"] })
      void queryClient.invalidateQueries({ queryKey: ["matches"] })
    },
  })
}
