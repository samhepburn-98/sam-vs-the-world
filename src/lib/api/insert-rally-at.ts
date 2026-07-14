import { useMutation, useQueryClient } from "@tanstack/react-query"

import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { RallyRow } from "@/lib/rally/rally-draft"

/** The mid-game insert (§5.4): insert_rally_at renumbers the later rallies
 *  of the game in one transaction (DEFERRABLE unique constraint). */
export function useInsertRallyAt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (row: RallyRow) => {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.rpc("insert_rally_at", {
        p_id: row.id,
        p_game_id: row.game_id,
        p_rally_number: row.rally_number,
        p_server_id: row.server_id,
        p_serve_side: row.serve_side,
        p_serve_number: row.serve_number,
        // null for lets — the RPC accepts it; the generated arg type conflates
        // optional with non-null
        p_winner_id: row.winner_id as string,
        p_end_reason: row.end_reason,
        p_error_detail: row.error_detail ?? undefined,
        p_forced: row.forced ?? undefined,
        p_winning_shot: row.winning_shot ?? undefined,
        p_losing_shot: row.losing_shot ?? undefined,
        p_shot_count: row.shot_count ?? undefined,
      })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["manage"] })
      void queryClient.invalidateQueries({ queryKey: ["matches"] })
      // every insight aggregate is derived from rally rows
      void queryClient.invalidateQueries({ queryKey: ["insights"] })
      // the home hub counts rallies
      void queryClient.invalidateQueries({ queryKey: ["home"] })
    },
  })
}
