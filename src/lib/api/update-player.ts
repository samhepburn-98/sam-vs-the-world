import { useMutation, useQueryClient } from "@tanstack/react-query"

import { playerEditSchema } from "@/lib/schemas/player"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { PlayerEditInput } from "@/lib/schemas/player"

export function useUpdatePlayer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...raw }: PlayerEditInput & { id: string }) => {
      const input = playerEditSchema.parse(raw)
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from("players")
        .update({ name: input.name, handedness: input.handedness })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["manage"] })
      void queryClient.invalidateQueries({ queryKey: ["players"] })
    },
  })
}
