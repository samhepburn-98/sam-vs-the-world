import { useMutation, useQueryClient } from "@tanstack/react-query"

import { gameEditSchema } from "@/lib/schemas/game"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { GameEditInput } from "@/lib/schemas/game"
import type { MutationConfig } from "@/lib/react-query"

export async function updateGame({
  id,
  ...raw
}: GameEditInput & { id: string }) {
  const input = gameEditSchema.parse(raw)
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("games")
    .update({ game_number: input.gameNumber })
    .eq("id", id)
  if (error) throw error
}

type UseUpdateGameOptions = {
  mutationConfig?: MutationConfig<typeof updateGame>
}

export function useUpdateGame({ mutationConfig }: UseUpdateGameOptions = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...restConfig } = mutationConfig ?? {}
  return useMutation({
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ["manage"] })
      void queryClient.invalidateQueries({ queryKey: ["matches"] })
      // game numbering orders the derived views the insight RPCs read
      void queryClient.invalidateQueries({ queryKey: ["insights"] })
      onSuccess?.(...args)
    },
    ...restConfig,
    mutationFn: updateGame,
  })
}
