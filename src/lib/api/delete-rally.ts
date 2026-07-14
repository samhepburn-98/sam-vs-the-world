import { useMutation, useQueryClient } from "@tanstack/react-query"

import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { RallyRow } from "@/lib/rally/rally-draft"
import type { WriteOp } from "@/lib/api/write-queue"

interface DeleteCapableClient {
  from: (table: "rallies") => {
    delete: () => {
      eq: (column: "id", value: string) => PromiseLike<{ error: unknown }>
    }
  }
}

/** Undo's rally delete as a queue op — deleting an already-absent row
 *  succeeds silently in PostgREST, so retries are naturally idempotent. */
export function deleteRallyOp(
  row: RallyRow,
  // tsc trips TS2589 (excessively deep) checking the real delete-builder type
  // against this slice; eslint's checker resolves it and calls the cast
  // unnecessary — narrow through unknown and keep both satisfied
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  client: DeleteCapableClient = getSupabaseBrowserClient() as unknown as DeleteCapableClient
): WriteOp {
  return {
    id: row.id,
    label: `undo rally ${row.rally_number}`,
    run: async () => {
      const { error } = await client.from("rallies").delete().eq("id", row.id)
      if (error) throw error
    },
  }
}

/** The same delete as a manage mutation (§5.4). */
export function useDeleteRally() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (row: RallyRow) => deleteRallyOp(row).run(),
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
