import { useMutation, useQueryClient } from "@tanstack/react-query"

import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { MutationConfig } from "@/lib/react-query"

/** Deleting a match cascades to its games and rallies (schema FKs). */
export async function deleteMatch(id: string) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("matches").delete().eq("id", id)
  if (error) throw error
}

type UseDeleteMatchOptions = {
  mutationConfig?: MutationConfig<typeof deleteMatch>
}

export function useDeleteMatch({ mutationConfig }: UseDeleteMatchOptions = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...restConfig } = mutationConfig ?? {}
  return useMutation({
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ["manage"] })
      void queryClient.invalidateQueries({ queryKey: ["matches"] })
      // every insight aggregate is derived from rally rows
      void queryClient.invalidateQueries({ queryKey: ["insights"] })
      // the home hub counts matches and rallies — this removes both
      void queryClient.invalidateQueries({ queryKey: ["home"] })
      onSuccess?.(...args)
    },
    ...restConfig,
    mutationFn: deleteMatch,
  })
}
