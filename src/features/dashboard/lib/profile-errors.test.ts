import { describe, expect, it } from "vitest"

import { computeProfileErrors } from "@/features/dashboard/lib/profile-errors"
import { error, player } from "@/features/dashboard/lib/player-data.fixtures"

// Baseline error(): tin 20, out_top 10, out_side 8, out_back 6, not_up 10 —
// 54 located, tin leads. Forced 33 / unforced 22, 12 games, empty trend.

describe("the wall", () => {
  it("maps the five zones straight off the payload", () => {
    const { wall } = computeProfileErrors(player())
    expect(wall).toEqual({ tin: 20, outTop: 10, outSide: 8, outBack: 6, notUp: 10 })
  })

  it("is all zeros before any payload arrives", () => {
    const { wall } = computeProfileErrors({})
    expect(wall).toEqual({ tin: 0, outTop: 0, outSide: 0, outBack: 0, notUp: 0 })
  })
})

describe("the biggest leak", () => {
  it("voices the dominant zone with its share", () => {
    const { insights } = computeProfileErrors(player())
    const [leak] = insights
    expect(leak.eyebrow).toBe("The biggest leak")
    expect(leak.title).toBe("The tin takes the most.")
    expect(leak.body).toContain("20 of 54")
    expect(leak.body).toContain("37%")
    expect(leak.highlight).toBe(true)
  })

  it("follows the leak when it isn't the tin", () => {
    // Sam-shaped: not up dominates
    const data = player({
      error: error({ tin: 19, out_top: 7, out_side: 5, out_back: 2, not_up: 55 }),
    })
    const [leak] = computeProfileErrors(data).insights
    expect(leak.title).toBe("The ball isn't getting there.")
    expect(leak.body).toContain("55 of 88")
    expect(leak.body).toContain("63%")
  })

  it("stays soft under the located-error threshold", () => {
    const data = player({
      error: error({ tin: 4, out_top: 2, out_side: 1, out_back: 0, not_up: 3 }),
    })
    const [leak] = computeProfileErrors(data).insights
    expect(leak.title).toBe("Too early to call.")
    expect(leak.body).not.toMatch(/\d/)
  })
})

describe("the ledger", () => {
  it("reads a forced majority as hard-earned", () => {
    const ledger = computeProfileErrors(player()).insights[1]
    expect(ledger.title).toBe("They have to earn it.")
    expect(ledger.body).toContain("33 of 55")
    expect(ledger.body).toContain("only 22")
  })

  it("reads an unforced majority as gifts", () => {
    const data = player({
      error: error({ forced_errors: 18, unforced_errors: 30 }),
    })
    const ledger = computeProfileErrors(data).insights[1]
    expect(ledger.title).toBe("More gifts than forced errors.")
    expect(ledger.body).toContain("30 of 48")
  })

  it("goes quiet under the tagged threshold", () => {
    const data = player({
      error: error({ forced_errors: 6, unforced_errors: 5 }),
    })
    const ledger = computeProfileErrors(data).insights[1]
    expect(ledger.title).toBe("Too early to call.")
  })
})

describe("the third card", () => {
  it("breaks down the out family when the leak is elsewhere", () => {
    // baseline: tin leads, out total 24 of 54 located
    const pattern = computeProfileErrors(player()).insights[2]
    expect(pattern.title).toBe("Out, three ways.")
    expect(pattern.body).toContain("24 balls flew out")
    expect(pattern.body).toContain("10 over the front wall, 8 off the sides, 6 past the back")
  })

  it("skips the out family when an out zone is already the leak", () => {
    const data = player({
      error: error({ tin: 5, out_top: 30, out_side: 4, out_back: 2, not_up: 6 }),
    })
    const { insights } = computeProfileErrors(data)
    expect(insights[0].title).toBe("Too much air.")
    // trend empty, untagged share low — falls through to the baseline rate
    expect(insights[2].title).toBe("The going rate.")
    expect(insights[2].body).toContain("60 errors across 12 games")
    expect(insights[2].body).toContain("5.0 given away per game")
  })

  it("reads the trend once enough matches carry it", () => {
    const trendPoint = (i: number, errors: number) => ({
      match_id: `00000000-0000-0000-0000-00000000000${i}`,
      date: `2026-06-0${i}`,
      errors,
      games: 2,
    })
    const data = player({
      error: error({
        // keep the out family under its gate so the trend can speak
        out_top: 2,
        out_side: 1,
        out_back: 1,
        tin: 30,
        not_up: 5,
        trend: [10, 10, 10, 4, 4, 4].map((n, i) => trendPoint(i + 1, n)),
      }),
    })
    const pattern = computeProfileErrors(data).insights[2]
    expect(pattern.title).toBe("The errors are drying up.")
    expect(pattern.body).toContain("5.0 errors a game over the first 3 matches")
    expect(pattern.body).toContain("2.0 over the last 3")
  })

  it("flags missing tags when they pile up", () => {
    const data = player({
      error: error({
        errors_total: 60,
        detail_untagged: 20,
        untagged_errors: 10,
        tin: 25,
        out_top: 2,
        out_side: 1,
        out_back: 0,
        not_up: 8,
      }),
    })
    const pattern = computeProfileErrors(data).insights[2]
    expect(pattern.title).toBe("Tags are missing.")
    expect(pattern.body).toContain("20 errors have no location")
    expect(pattern.body).toContain("10 no forced call")
  })

  it("has a number-free story before any errors exist", () => {
    const { insights } = computeProfileErrors({})
    expect(insights[2].title).toBe("Nothing to map yet.")
    expect(insights[2].body).not.toMatch(/\d/)
  })
})

describe("lede", () => {
  it("names the biggest leak with its share", () => {
    const { lede } = computeProfileErrors(player())
    expect(lede).toContain("drawn where it died")
    expect(lede).toContain("37% of them hit the tin")
  })

  it("falls back before the wall is populated", () => {
    const { lede } = computeProfileErrors({})
    expect(lede).toContain("fills in as errors are tagged")
  })
})
