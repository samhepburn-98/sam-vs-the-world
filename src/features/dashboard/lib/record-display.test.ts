import { describe, expect, it } from "vitest"

import { buildRecordTiles } from "@/features/dashboard/lib/record-display"

import type { RecordRow } from "@/features/dashboard/schemas/records"

const SAM = "11111111-1111-4111-8111-111111111111"
const ALEX = "22222222-2222-4222-8222-222222222222"
const MATCH = "33333333-3333-4333-8333-333333333333"

const nameOf = (id: string) =>
  id === SAM ? "Sam" : id === ALEX ? "Alex" : "Unknown"

function row(overrides: Partial<RecordRow>): RecordRow {
  return {
    record_key: "longest_rally",
    player_id: SAM,
    player1_id: SAM,
    player2_id: ALEX,
    value: 23,
    detail: null,
    match_id: MATCH,
    date: "2026-07-14",
    ...overrides,
  }
}

describe("buildRecordTiles", () => {
  it("shouts the scoreline for the biggest win, not the margin", () => {
    const [tile] = buildRecordTiles(
      [row({ record_key: "biggest_win", value: 3, detail: "3–0" })],
      nameOf
    )
    expect(tile).toMatchObject({
      title: "Biggest win",
      value: "3–0",
      unit: null,
      lead: "Sam",
      isHolder: true,
      rest: "14 Jul 2026",
    })
  })

  it("anchors the tone to the holder's side in the record's match", () => {
    const tiles = buildRecordTiles(
      [
        row({ record_key: "biggest_win", player_id: SAM }),
        row({ record_key: "longest_rally", player_id: ALEX }),
        row({ record_key: "most_lets", player_id: null }),
      ],
      nameOf
    )
    expect(tiles.map((t) => t.tone)).toEqual(["p1", "p2", null])
  })

  it("pluralises units, including the irregular rally", () => {
    const tiles = buildRecordTiles(
      [
        row({ record_key: "longest_rally", value: 1 }),
        row({ record_key: "best_streak", value: 6 }),
        row({ record_key: "marathon_game", player_id: null, value: 27, detail: "15–13" }),
      ],
      nameOf
    )
    expect(tiles.map((t) => t.unit)).toEqual(["shot", "wins", "rallies"])
  })

  it("captions a match-owned record with the pairing, score first", () => {
    const [tile] = buildRecordTiles(
      [
        row({
          record_key: "marathon_game",
          player_id: null,
          value: 27,
          detail: "15–13",
        }),
      ],
      nameOf
    )
    expect(tile).toMatchObject({
      lead: "Sam v Alex",
      isHolder: false,
      rest: "15–13 · 14 Jul 2026",
    })
  })

  it("keeps the wall's stable order and skips unheld records", () => {
    const tiles = buildRecordTiles(
      [
        row({ record_key: "most_lets", player_id: null, value: 9 }),
        row({ record_key: "biggest_win", value: 3, detail: "3–0" }),
      ],
      nameOf
    )
    expect(tiles.map((t) => t.key)).toEqual(["biggest_win", "most_lets"])
  })
})
