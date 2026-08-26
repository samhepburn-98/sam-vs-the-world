import { describe, expect, it } from "vitest"

import { parseRecordRows } from "@/features/dashboard/schemas/records"

// The tolerant reader is the deploy bridge: a database one migration ahead
// of the worker must never break the home page. These tests pin BOTH halves
// — unknown keys drop silently, corrupt known rows still fail loudly — so a
// well-meaning "simplification" to a plain strict array parse can't land
// without a red test.

const KNOWN = {
  record_key: "longest_rally",
  player_id: "11111111-1111-4111-8111-111111111111",
  player1_id: "11111111-1111-4111-8111-111111111111",
  player2_id: "22222222-2222-4222-8222-222222222222",
  value: 23,
  detail: null,
  match_id: "33333333-3333-4333-8333-333333333333",
  date: "2026-07-14",
}

describe("parseRecordRows", () => {
  it("drops rows whose record_key this client doesn't know", () => {
    const rows = parseRecordRows([
      KNOWN,
      { ...KNOWN, record_key: "fastest_game" }, // a future record
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]?.record_key).toBe("longest_rally")
  })

  it("still fails loudly on a corrupt row with a KNOWN key", () => {
    expect(() =>
      parseRecordRows([{ ...KNOWN, match_id: "not-a-uuid" }])
    ).toThrow()
  })

  it("passes a clean payload through intact", () => {
    expect(parseRecordRows([KNOWN])).toEqual([KNOWN])
  })
})
