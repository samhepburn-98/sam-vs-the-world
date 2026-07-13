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

describe("buildServePressure", () => {
  it("stays quiet before two-serve rallies reach the threshold", () => {
    const { servePressure } = computeProfileStats(fx.player())
    expect(servePressure.read).toContain("once two-serve rallies are logged")
    expect(servePressure.first.of).toBe(0)
  })

  it("celebrates a first serve that rarely misses", () => {
    const { servePressure } = computeProfileStats(
      fx.player({
        serve: fx.serve({
          two_serve_rallies_served: 170,
          first_serve_faults: 9,
          serve1_served: 161,
          serve1_wins: 98,
          serve2_served: 9,
          serve2_wins: 6,
        }),
      }),
    )
    expect(servePressure.read).toBe(
      "The first serve rarely misses — 9 faults in 170 serves.",
    )
    expect(servePressure.first).toEqual({
      label: "First serve",
      won: 98,
      of: 161,
    })
    expect(servePressure.faults).toEqual({
      label: "First-serve faults",
      won: 9,
      of: 170,
    })
  })

  it("counts the second serve plainly while its sample is small", () => {
    const { servePressure } = computeProfileStats(
      fx.player({
        serve: fx.serve({
          two_serve_rallies_served: 72,
          first_serve_faults: 12,
          serve1_served: 60,
          serve1_wins: 43,
          serve2_served: 12,
          serve2_wins: 6,
        }),
      }),
    )
    expect(servePressure.read).toBe(
      "When the first serve misses, the second has won 6 of 12.",
    )
  })

  it("calls the liability once both serves are rated", () => {
    const { servePressure } = computeProfileStats(
      fx.player({
        serve: fx.serve({
          two_serve_rallies_served: 200,
          first_serve_faults: 40,
          serve1_served: 160,
          serve1_wins: 112, // 70%
          serve2_served: 40,
          serve2_wins: 18, // 45%
        }),
      }),
    )
    expect(servePressure.read).toBe(
      "The second serve is a liability — a 25-point drop when the first one misses.",
    )
  })

  it("credits a second serve that holds", () => {
    const { servePressure } = computeProfileStats(
      fx.player({
        serve: fx.serve({
          two_serve_rallies_served: 200,
          first_serve_faults: 40,
          serve1_served: 160,
          serve1_wins: 96, // 60%
          serve2_served: 40,
          serve2_wins: 22, // 55%
        }),
      }),
    )
    expect(servePressure.read).toBe(
      "The second serve holds — 55% won against 60% behind the first.",
    )
  })
})
