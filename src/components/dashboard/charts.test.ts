import { describe, expect, it } from "vitest"

import { toErrorTypeData } from "./error-breakdown"
import { computeLeadSeries, zeroOffset } from "./momentum-chart"
import { toHistoBuckets } from "./rally-length-histo"
import { shouldPlotLine } from "./win-rate-trend"

import type { ErrorProfile, RallyLengths } from "@/lib/schemas/insights"
import type { RallyScored } from "@/lib/schemas/rally"

const P1 = "11111111-1111-1111-1111-111111111111"
const P2 = "22222222-2222-2222-2222-222222222222"

function rally(n: number, p1Score: number, p2Score: number): RallyScored {
  return {
    rally_number: n,
    player1_id: P1,
    player2_id: P2,
    score_p1: p1Score,
    score_p2: p2Score,
  } as RallyScored
}

describe("computeLeadSeries", () => {
  it("orders by rally number and reads lead from the player's own side", () => {
    const rallies = [rally(3, 2, 1), rally(1, 1, 0), rally(2, 1, 1)]
    // from P1's side: +score_p1 − score_p2
    expect(computeLeadSeries(rallies, P1)).toEqual([
      { rally: 1, lead: 1 },
      { rally: 2, lead: 0 },
      { rally: 3, lead: 1 },
    ])
    // P2 sees the mirror image
    expect(computeLeadSeries(rallies, P2)).toEqual([
      { rally: 1, lead: -1 },
      { rally: 2, lead: 0 },
      { rally: 3, lead: -1 },
    ])
  })
})

describe("zeroOffset", () => {
  it("places the colour flip proportional to the lead range", () => {
    // all-positive → zero sits at the bottom (offset 1)
    expect(zeroOffset([{ rally: 1, lead: 3 }])).toBe(1)
    // symmetric range → the flip is halfway
    expect(
      zeroOffset([
        { rally: 1, lead: 2 },
        { rally: 2, lead: -2 },
      ]),
    ).toBeCloseTo(0.5, 5)
  })
})

describe("shouldPlotLine", () => {
  it("draws a line only once there are enough points", () => {
    expect(shouldPlotLine(4)).toBe(false)
    expect(shouldPlotLine(5)).toBe(true)
  })
})

describe("toHistoBuckets", () => {
  it("computes per-bucket win rate, null when the bucket is empty", () => {
    const lengths = {
      short_rallies: 4,
      short_wins: 1,
      medium_rallies: 2,
      medium_wins: 2,
      long_rallies: 0,
      long_wins: 0,
    } as RallyLengths
    const buckets = toHistoBuckets(lengths)
    expect(buckets.map((b) => b.winRate)).toEqual([25, 100, null])
  })
})

describe("toErrorTypeData", () => {
  it("carries every detail bucket into one stacked row", () => {
    const profile = {
      tin: 3,
      out_top: 1,
      not_up: 2,
      out_side: 0,
      out_back: 0,
      double_bounce: 1,
      detail_untagged: 4,
    } as ErrorProfile
    expect(toErrorTypeData(profile)[0]).toMatchObject({
      tin: 3,
      not_up: 2,
      detail_untagged: 4,
    })
  })
})
