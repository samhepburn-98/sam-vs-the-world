import { describe, expect, it } from "vitest"

import { classifyQuery, sanitizeSort } from "./manage-list"

describe("classifyQuery", () => {
  it("recognises a pasted uuid (any case)", () => {
    expect(classifyQuery("11111111-1111-4111-8111-111111111111")).toEqual({
      kind: "uuid",
      value: "11111111-1111-4111-8111-111111111111",
    })
    expect(classifyQuery("AAAAAAAA-2222-4222-8222-222222222222").kind).toBe(
      "uuid"
    )
  })

  it("recognises bare numbers and free text", () => {
    expect(classifyQuery("3")).toEqual({ kind: "number", value: 3 })
    expect(classifyQuery("  ")).toEqual({ kind: "empty" })
    expect(classifyQuery("club court 2 ")).toEqual({
      kind: "text",
      value: "club court 2",
    })
  })

  it("strips PostgREST or()-syntax characters from text", () => {
    expect(classifyQuery("a,b%c(d)")).toEqual({ kind: "text", value: "abcd" })
  })
})

describe("sanitizeSort", () => {
  const allowed = new Set(["date", "created_at"])

  it("passes whitelisted columns and falls back otherwise", () => {
    expect(
      sanitizeSort({ column: "date", dir: "asc" }, allowed, "date")
    ).toEqual({ column: "date", dir: "asc" })
    expect(
      sanitizeSort({ column: "evil; drop", dir: "asc" }, allowed, "date")
    ).toEqual({ column: "date", dir: "desc" })
  })
})
