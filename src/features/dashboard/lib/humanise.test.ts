import { describe, expect, it } from "vitest"

import { formatLabel, humanise } from "@/features/dashboard/lib/humanise"

describe("humanise", () => {
  it("turns a stored enum value into a sentence-case label", () => {
    expect(humanise("serve_fault")).toBe("Serve fault")
    expect(humanise("out_top")).toBe("Out top")
    expect(humanise("winner")).toBe("Winner")
  })
})

describe("formatLabel", () => {
  // format is nullable by design: a null match is a casual session, which is
  // the common case here, not a missing value (§7.7)
  it("calls a null format a casual session", () => {
    expect(formatLabel(null)).toBe("Casual")
  })

  it("names the best-of for a formatted match", () => {
    expect(formatLabel(3)).toBe("Best of 3")
    expect(formatLabel(5)).toBe("Best of 5")
  })
})
