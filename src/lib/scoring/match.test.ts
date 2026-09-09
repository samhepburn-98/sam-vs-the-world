import { describe, expect, it } from "vitest"

import { orientOutcome, outcomeChip } from "./match"

import type { MatchOutcome } from "@/lib/schemas/match"

const OUTCOMES: Array<MatchOutcome> = ["p1", "p2", "draw", "pending"]

describe("orientOutcome", () => {
  it("reads the same result from either side of the net", () => {
    expect(orientOutcome("p1", true)).toBe("won")
    expect(orientOutcome("p1", false)).toBe("lost")
    expect(orientOutcome("p2", true)).toBe("lost")
    expect(orientOutcome("p2", false)).toBe("won")
  })

  it("keeps draws and pending neutral", () => {
    expect(orientOutcome("draw", true)).toBe("drawn")
    expect(orientOutcome("draw", false)).toBe("drawn")
    expect(orientOutcome("pending", true)).toBe("pending")
    expect(orientOutcome("pending", false)).toBe("pending")
  })
})

describe("outcomeChip", () => {
  it("orients the letter to the side asked for", () => {
    expect(outcomeChip("p1", true)).toBe("w")
    expect(outcomeChip("p1", false)).toBe("l")
    expect(outcomeChip("p2", true)).toBe("l")
    expect(outcomeChip("p2", false)).toBe("w")
  })

  it("gives both sides a draw", () => {
    expect(outcomeChip("draw", true)).toBe("d")
    expect(outcomeChip("draw", false)).toBe("d")
  })

  // the null is the point: a match still being logged has no verdict, and
  // each surface shows something different in its place rather than a chip
  it("awards no letter while a match is pending", () => {
    expect(outcomeChip("pending", true)).toBeNull()
    expect(outcomeChip("pending", false)).toBeNull()
  })

  it("never disagrees with orientOutcome", () => {
    const letterFor = { won: "w", lost: "l", drawn: "d", pending: null }
    for (const outcome of OUTCOMES) {
      for (const isP1 of [true, false]) {
        expect(outcomeChip(outcome, isP1)).toBe(
          letterFor[orientOutcome(outcome, isP1)]
        )
      }
    }
  })
})
