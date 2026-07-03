import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { RallyRow } from "@/lib/logger/rally-draft"
import type { WriteOp } from "@/lib/queue/write-queue"

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
    shot_type: row.shot_type,
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
