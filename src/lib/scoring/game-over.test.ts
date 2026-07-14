import { describe, expect, it } from "vitest"

import { gameOver } from "./game-over"
import { DEFAULT_HOUSE_RULES } from "./types"

const winBy2 = DEFAULT_HOUSE_RULES
const suddenDeath = {
  ...DEFAULT_HOUSE_RULES,
  tiebreak: "sudden_death" as const,
}

describe("gameOver — win_by_2 (default)", () => {
  it.each([
    [{ p1: 11, p2: 9 }, true],
    [{ p1: 9, p2: 11 }, true],
    [{ p1: 11, p2: 10 }, false], // must win by two
    [{ p1: 10, p2: 10 }, false],
    [{ p1: 12, p2: 10 }, true], // overtime resolves
    [{ p1: 11, p2: 11 }, false],
    [{ p1: 13, p2: 11 }, true],
    [{ p1: 10, p2: 8 }, false], // below target
    [{ p1: 0, p2: 0 }, false],
  ])("%o → over: %s", (score, over) => {
    expect(gameOver(score, winBy2).over).toBe(over)
  })

  it("reports the leader", () => {
    expect(gameOver({ p1: 9, p2: 11 }, winBy2)).toEqual({
      over: true,
      leader: "p2",
    })
  })

  it("keeps reporting over when casual play continues past the target", () => {
    // The banner is a suggestion; logging 12-10 → 13-10 just re-reports.
    expect(gameOver({ p1: 13, p2: 10 }, winBy2).over).toBe(true)
  })

  it("respects a non-11 target score", () => {
    const to15 = { ...winBy2, targetScore: 15 }
    expect(gameOver({ p1: 11, p2: 9 }, to15).over).toBe(false)
    expect(gameOver({ p1: 15, p2: 13 }, to15).over).toBe(true)
  })
})

describe("gameOver — sudden death", () => {
  it("ends 11-10 (one point decides at 10-10)", () => {
    expect(gameOver({ p1: 10, p2: 11 }, suddenDeath)).toEqual({
      over: true,
      leader: "p2",
    })
  })

  it("still ends normal margins", () => {
    expect(gameOver({ p1: 11, p2: 7 }, suddenDeath).over).toBe(true)
  })

  it("not over at 10-10", () => {
    expect(gameOver({ p1: 10, p2: 10 }, suddenDeath).over).toBe(false)
  })
})
