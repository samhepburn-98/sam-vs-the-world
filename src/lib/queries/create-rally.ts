import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { RallyRow } from "@/lib/logger/rally-draft"
import type { WriteOp } from "@/lib/queue/write-queue"

interface InsertCapableClient {
  from: (table: "rallies") => {
    insert: (values: Record<string, unknown>) => PromiseLike<{ error: unknown }>
  }
}

/** One rally insert as a queue op — id is the client uuid (idempotent retry). */
export function insertRallyOp(
  row: RallyRow,
  client: InsertCapableClient = getSupabaseBrowserClient(),
): WriteOp {
  return {
    id: row.id,
    label: `save rally ${row.rally_number}`,
    run: async () => {
      const { error } = await client.from("rallies").insert({ ...row })
      if (error) throw error
    },
  }
}
