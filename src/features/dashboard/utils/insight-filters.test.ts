import { describe, expect, it } from "vitest"

import {
  hasActiveFilters,
  insightSearch,
  searchToFilters,
} from "./insight-filters"

const UUID = "5d195cf9-ab65-4d91-b0e4-5df7b91142aa"

describe("insightSearch", () => {
  it("round-trips a full set of params through the URL contract", () => {
    const params = {
      vs: UUID,
      ball: "double_yellow",
      from: "2026-06-01",
      to: "2026-06-30",
    }
    const parsed = insightSearch.parse(params)
    expect(parsed).toEqual(params)
    expect(searchToFilters(parsed)).toEqual({
      opponentId: UUID,
      ballType: "double_yellow",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
    })
  })

  it("degrades a malformed param to no-filter rather than throwing", () => {
    const parsed = insightSearch.parse({
      vs: "not-a-uuid",
      ball: "purple",
      from: "nope",
    })
    expect(parsed.vs).toBeUndefined()
    expect(parsed.ball).toBeUndefined()
    expect(parsed.from).toBeUndefined()
    expect(searchToFilters(parsed)).toEqual({
      opponentId: null,
      ballType: null,
      dateFrom: null,
      dateTo: null,
    })
  })

  it("treats an empty search as no active filters", () => {
    expect(hasActiveFilters(insightSearch.parse({}))).toBe(false)
    expect(hasActiveFilters(insightSearch.parse({ ball: "red" }))).toBe(true)
  })
})
