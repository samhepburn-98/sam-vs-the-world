import { useMutation, useQueryClient } from "@tanstack/react-query"

import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { RallyRow } from "@/lib/rally/rally-draft"
import type { WriteOp } from "@/lib/api/write-queue"

interface UpdateCapableClient {
  from: (table: "rallies") => {
    update: (values: Record<string, unknown>) => {
      eq: (column: "id", value: string) => PromiseLike<{ error: unknown }>
    }
  }
}

/** One rally edit as a queue op — updates by id, naturally idempotent.
 *  Identity/position (id, game_id, rally_number) is not editable. */
export function updateRallyOp(
  row: RallyRow,
  // tsc trips TS2589 (excessively deep) checking the real update-builder type
  // against this slice; eslint's checker resolves it and calls the cast
  // unnecessary — narrow through unknown and keep both satisfied
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  client: UpdateCapableClient = getSupabaseBrowserClient() as unknown as UpdateCapableClient,
): WriteOp {
  const fields = {
    server_id: row.server_id,
    serve_side: row.serve_side,
    serve_number: row.serve_number,
    winner_id: row.winner_id,
    end_reason: row.end_reason,
    error_detail: row.error_detail,
    forced: row.forced,
    winning_shot: row.winning_shot,
    losing_shot: row.losing_shot,
    shot_count: row.shot_count,
  }
  return {
    id: row.id,
    label: `edit rally ${row.rally_number}`,
    run: async () => {
      const { error } = await client
        .from("rallies")
        .update(fields)
        .eq("id", row.id)
      if (error) throw error
    },
  }
}

/** The same update as a manage mutation (§5.4) — the logger uses the queue
 *  op above; manage edits are direct and invalidate the browsers. */
export function useUpdateRally() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (row: RallyRow) => updateRallyOp(row).run(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["manage"] })
      void queryClient.invalidateQueries({ queryKey: ["matches"] })
      // every insight aggregate is derived from rally rows (no count change,
      // so the home tallies stay put)
      void queryClient.invalidateQueries({ queryKey: ["insights"] })
    },
  })
}
