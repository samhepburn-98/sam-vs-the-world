import { describe, expect, it } from "vitest"

import * as fx from "@/features/dashboard/lib/player-data.fixtures"
import { computeProfileStats } from "@/features/dashboard/lib/profile-stats"

describe("computeProfileStats", () => {
  it("maps the three rally-length buckets with their win rates", () => {
    const { curve } = computeProfileStats(
      fx.player({
        rally: fx.rally({
          short_rallies: 80,
          short_wins: 40,
          medium_rallies: 60,
          medium_wins: 39,
          long_rallies: 40,
          long_wins: 18,
        }),
      })
    )
    expect(curve.map((b) => b.winRate)).toEqual([50, 65, 45])
    expect(curve.map((b) => b.label)).toEqual([
      "1–3 · 80",
      "4–8 · 60",
      "9+ · 40",
    ])
  })

  it("nulls a bucket's win rate when it has no rallies", () => {
    const { curve } = computeProfileStats(
      fx.player({ rally: fx.rally({ long_rallies: 0, long_wins: 0 }) })
    )
    expect(curve[2].winRate).toBeNull()
  })

  it("reads the three momentum phases as win-rate rows", () => {
    const { phases } = computeProfileStats(
      fx.player({
        momentum: fx.momentum({
          early_rallies: 100,
          early_wins: 60,
          mid_rallies: 80,
          mid_wins: 40,
          close_rallies: 50,
          close_wins: 20,
        }),
      })
    )
    expect(phases.rows.map((r) => r.label)).toEqual([
      "Early",
      "Mid",
      "From 9–all",
    ])
    expect(phases.rows.map((r) => [r.won, r.of])).toEqual([
      [60, 100],
      [40, 80],
      [20, 50],
    ])
    // 60% early vs 40% close — leakier late
    expect(phases.read).toBe("Strong early, leakier once it's close.")
  })

  it("maps serve boxes straight from the serve payload", () => {
    const { serve } = computeProfileStats(
      fx.player({
        serve: fx.serve({
          left_served: 48,
          left_wins: 34,
          right_served: 71,
          right_wins: 45,
          aces: 6,
          double_faults: 4,
        }),
      })
    )
    expect(serve.left).toEqual({ won: 34, of: 48 })
    expect(serve.right).toEqual({ won: 45, of: 71 })
    expect(serve.aces).toBe(6)
    expect(serve.doubleFaults).toBe(4)
  })

  it("folds the three out details into one Out row and reports the totals", () => {
    const { errorsGiven } = computeProfileStats(
      fx.player({
        error: fx.error({
          errors_total: 52,
          tin: 24,
          not_up: 11,
          out_top: 3,
          out_side: 9,
          out_back: 5,
          unforced_errors: 38,
          forced_errors: 14,
        }),
      })
    )
    const out = errorsGiven.rows.find((r) => r.label === "Out")!
    expect(out.count).toBe(17)
    expect(errorsGiven.rows.find((r) => r.label === "Tin")!.share).toBe(46)
    expect(errorsGiven.read).toBe(
      "52 total · 38 unforced, 14 forced out of you"
    )
  })

  it("counts the winning point-enders by shot with their shares", () => {
    const { pointEnders } = computeProfileStats(
      fx.player({
        decisive: fx.decisive({
          winning_drive: 9,
          winning_drop: 2,
          winning_boast: 1,
        }),
      })
    )
    expect(pointEnders.rows.map((r) => [r.label, r.count])).toEqual([
      ["Drive", 9],
      ["Drop", 2],
      ["Boast", 1],
    ])
    expect(pointEnders.rows.find((r) => r.label === "Drive")!.share).toBe(75)
    expect(pointEnders.read).toBe("12 decisive shots tagged.")
  })

  it("dashes rather than dividing by zero when payloads are empty", () => {
    const { curve, serve, pointEnders, errorsGiven } = computeProfileStats({})
    expect(curve.every((b) => b.winRate === null)).toBe(true)
    expect(serve.left.of).toBe(0)
    expect(pointEnders.rows.every((r) => r.count === 0)).toBe(true)
    expect(pointEnders.read).toBe("No decisive shots tagged yet.")
    expect(errorsGiven.rows.every((r) => r.share === 0)).toBe(true)
  })
})
