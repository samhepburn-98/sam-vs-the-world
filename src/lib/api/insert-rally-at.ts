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
        p_winner_id: row.winner_id,
        p_end_reason: row.end_reason,
        p_error_detail: row.error_detail,
        p_forced: row.forced,
        p_shot_type: row.shot_type,
        p_shot_count: row.shot_count,
      })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["manage"] })
      void queryClient.invalidateQueries({ queryKey: ["matches"] })
    },
  })
}
