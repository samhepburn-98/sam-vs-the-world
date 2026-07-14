import { useMutation, useQueryClient } from "@tanstack/react-query"

import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

/** Deleting a match cascades to its games and rallies (schema FKs). */
export function useDeleteMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("matches").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["manage"] })
      void queryClient.invalidateQueries({ queryKey: ["matches"] })
      // every insight aggregate is derived from rally rows
      void queryClient.invalidateQueries({ queryKey: ["insights"] })
      // the home hub counts matches and rallies — this removes both
      void queryClient.invalidateQueries({ queryKey: ["home"] })
    },
  })
}
