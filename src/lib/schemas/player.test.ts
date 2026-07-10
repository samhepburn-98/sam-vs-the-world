import { describe, expect, it } from "vitest"

import {
  PLAYER_SUMMARY_COLUMNS,
  playerSummary,
} from "@/lib/schemas/player"

describe("PLAYER_SUMMARY_COLUMNS", () => {
  it("names every column playerSummary parses", () => {
    // a select() that omits a key parses to a throw at runtime, not a type
    // error — this pins the column list to the schema so they can't drift
    const columns = PLAYER_SUMMARY_COLUMNS.split(", ")
    expect(columns.sort()).toEqual(Object.keys(playerSummary.shape).sort())
    expect(columns).toContain("avatar_url")
  })

  it("a row fetched with those columns satisfies the schema", () => {
    const row = {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Sam",
      handedness: null,
      avatar_url: null,
    }
    expect(() => playerSummary.parse(row)).not.toThrow()
  })
})
