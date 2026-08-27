import { queryOptions, useQuery } from "@tanstack/react-query"

import { parseRecordRows } from "@/features/dashboard/schemas/records"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { RecordRow } from "@/features/dashboard/schemas/records"

// The all-time records — one global set, cached once. The home wall and the
// profile's "Records held" filter the same rows, so navigating between them
// never refetches. Keyed under the insights domain because records derive
// from the same rallies/games/matches: every mutation that can set or break
// a record already invalidates the ["insights"] prefix.

export async function fetchRecords(): Promise<Array<RecordRow>> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("records")
  if (error) throw error
  // tolerant reader (parseRecordRows): a just-migrated database may be one
  // record ahead of the deployed app — unknown keys drop, they don't throw.
  return parseRecordRows(data)
}

export const recordsQueryOptions = () =>
  queryOptions({ queryKey: ["insights", "records"], queryFn: fetchRecords })

export function useRecords() {
  return useQuery(recordsQueryOptions())
}
