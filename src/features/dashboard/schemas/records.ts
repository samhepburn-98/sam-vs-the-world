import { z } from "zod"

// Schema for the records() RPC — the all-time records wall. One uniform row
// per record, validated at the query boundary like every other insight
// payload.

/** The records the client knows how to caption. The fetch drops rows with
 *  keys outside this list instead of failing: a migration can land moments
 *  before the worker deploy, and a record the running client hasn't heard
 *  of should be invisible, not fatal. */
export const recordKey = z.enum([
  "biggest_win",
  "longest_rally",
  "best_streak",
  "marathon_game",
  "most_aces",
  "most_lets",
])
export type RecordKey = z.infer<typeof recordKey>

/** One `records()` row: the holder (null when the record belongs to the
 *  match, e.g. the marathon), the match pairing for captions, the value the
 *  tile shouts, and the provenance link. */
export const recordRow = z.object({
  record_key: recordKey,
  player_id: z.string().uuid().nullable(),
  player1_id: z.string().uuid(),
  player2_id: z.string().uuid(),
  value: z.number().int(),
  detail: z.string().nullable(),
  match_id: z.string().uuid(),
  date: z.string(),
})
export type RecordRow = z.infer<typeof recordRow>

/** The tolerant reader for the records payload: rows with unknown keys are
 *  dropped (see recordKey above), rows with KNOWN keys still parse strictly
 *  so real corruption fails loudly at the boundary, not as a rendering bug. */
export function parseRecordRows(
  rows: Array<{ record_key: string; [column: string]: unknown }>
): Array<RecordRow> {
  return rows
    .filter((row) => recordKey.safeParse(row.record_key).success)
    .map((row) => recordRow.parse(row))
}
