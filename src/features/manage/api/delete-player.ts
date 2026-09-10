import { useMutation, useQueryClient } from "@tanstack/react-query"

import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { MutationConfig } from "@/lib/react-query"

/** Players referenced by any match are FK-protected (on delete restrict) —
 *  the DB refuses, and the dialog surfaces that as a friendly error. */
export async function deletePlayer(id: string) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("players").delete().eq("id", id)
  if (error) throw error
}

type UseDeletePlayerOptions = {
  mutationConfig?: MutationConfig<typeof deletePlayer>
}

export function useDeletePlayer({
  mutationConfig,
}: UseDeletePlayerOptions = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...restConfig } = mutationConfig ?? {}
  return useMutation({
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ["manage"] })
      void queryClient.invalidateQueries({ queryKey: ["players"] })
      // the roster headline is one RPC row per player — this removes one
      void queryClient.invalidateQueries({
        queryKey: ["insights", "players-headline"],
      })
      onSuccess?.(...args)
    },
    ...restConfig,
    mutationFn: deletePlayer,
  })
}
