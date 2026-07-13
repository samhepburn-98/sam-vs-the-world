import { describe, expect, it } from "vitest"

import { computeProfileShape } from "@/features/dashboard/lib/profile-shape"
import {
  decisive,
  headline,
  momentum,
  player,
  serve,
} from "@/features/dashboard/lib/player-data.fixtures"

// Baseline attrs from player(): srv 58, ret 47, att 44, con 60, grd 54,
// clu 64 — so strength is clu, weakness is att, and any pattern rooted in
// either must stand down.

describe("strength and weakness", () => {
  it("voices the highest attribute as the strength, with its numbers", () => {
    const { insights } = computeProfileShape(player())
    const [strength] = insights
    expect(strength.eyebrow).toBe("Strength")
    expect(strength.title).toBe("Big points, best squash.")
    expect(strength.body).toContain("64%")
    expect(strength.body).toContain("32 of 50")
    expect(strength.highlight).toBe(true)
  })

  it("voices the lowest attribute as the weakness", () => {
    const { insights } = computeProfileShape(player())
    const weakness = insights[1]
    expect(weakness.eyebrow).toBe("Weakness")
    expect(weakness.title).toBe("Short rallies slip away.")
    expect(weakness.body).toContain("44%")
    expect(weakness.body).toContain("35 of 80")
    expect(weakness.highlight).toBeUndefined()
  })

  it("names the serve gap when the return is the weakness", () => {
    const data = player({ serve: serve({ return_wins: 30 }) }) // ret 30, srv 58
    const weakness = computeProfileShape(data).insights[1]
    expect(weakness.title).toBe("The return game leaks.")
    expect(weakness.body).toContain("A 28-point gap off the serve number")
  })

  it("breaks ties toward card order, so picks are stable", () => {
    // srv joins clu at 64 — srv comes first in card order
    const data = player({ serve: serve({ serve_wins: 64 }) })
    const [strength] = computeProfileShape(data).insights
    expect(strength.title).toBe("The serve is the weapon.")
  })

  it("falls back to soft copy when nothing is rated yet", () => {
    const { lede, insights } = computeProfileShape({})
    const [strength, weakness] = insights
    expect(strength.title).toBe("Too early to call.")
    expect(strength.body).not.toMatch(/\d/)
    expect(weakness.title).toBe("Too early to call.")
    expect(lede).toContain("fills in as rallies are logged")
  })

  it("needs a second rated attribute before calling a weakness", () => {
    const data = { serve: serve({ rallies_returned: 10 }) } // only srv rated
    const [strength, weakness] = computeProfileShape(data).insights
    expect(strength.title).toBe("The serve is the weapon.")
    expect(weakness.title).toBe("Too early to call.")
    expect(weakness.body).toContain("two rated attributes")
  })
})

describe("pattern", () => {
  it("skips candidates rooted in the strength or weakness", () => {
    // baseline: early 52% vs close 64% would fire the phase swing, but its
    // root (clu) is the strength — the fallback renders instead
    const pattern = computeProfileShape(player()).insights[2]
    expect(pattern.eyebrow).toBe("Pattern")
    expect(pattern.title).toBe("Built for the long game.")
    expect(pattern.body).toContain("8.4 shots")
    expect(pattern.body).toContain("34")
  })

  it("calls the box gap when one side wins a clear margin", () => {
    const data = player({
      serve: serve({ left_wins: 40, right_wins: 20 }), // 80% vs 40%
    })
    const pattern = computeProfileShape(data).insights[2]
    expect(pattern.title).toBe("The left box is the launchpad.")
    expect(pattern.body).toContain("80% of serve points won from the left box")
    expect(pattern.body).toContain("40% from the right")
  })

  it("calls the shot mix when one shot dominates the winners", () => {
    const data = player({
      decisive: decisive({
        winning_drive: 30,
        winning_drop: 10,
        winning_boast: 5,
      }),
    })
    const pattern = computeProfileShape(data).insights[2]
    expect(pattern.title).toBe("The drive does the killing.")
    expect(pattern.body).toContain("30 of 45 decisive shots are drives")
    expect(pattern.body).toContain("10 drops and 5 boasts")
  })

  it("prefers the louder finding when several fire", () => {
    const data = player({
      serve: serve({ left_wins: 40, right_wins: 20 }), // gap 40
      decisive: decisive({
        winning_drive: 30,
        winning_drop: 10,
        winning_boast: 5,
      }), // salience 67 - 33 = 34
    })
    const pattern = computeProfileShape(data).insights[2]
    expect(pattern.title).toBe("The left box is the launchpad.")
  })

  it("reads the phase swing both ways when clutch is mid-pack", () => {
    // clu 52 sits between con 60 and att 44, so the swing may speak
    const surge = computeProfileShape(
      player({
        momentum: momentum({ early_wins: 40, close_wins: 26 }), // 40% → 52%
      })
    ).insights[2]
    expect(surge.title).toBe("The tighter it gets, the better it goes.")
    expect(surge.body).toContain("12-point climb")

    const fade = computeProfileShape(
      player({
        momentum: momentum({ early_wins: 60, close_wins: 26 }), // 60% → 52%
      })
    ).insights[2]
    expect(fade.title).toBe("Strong early, leakier late.")
    expect(fade.body).toContain("8-point drop")
  })

  it("stays quiet about patterns until the samples are real", () => {
    const data = player({
      serve: serve({ left_served: 10, left_wins: 9, right_served: 10, right_wins: 2 }),
      decisive: decisive(), // 12 tagged < threshold
      momentum: momentum({ close_rallies: 20, close_wins: 13 }),
      headline: headline({ signature_trait: "balanced" }),
    })
    const pattern = computeProfileShape(data).insights[2]
    expect(pattern.title).toBe("No single habit dominates.")
  })

  it("has a number-free fallback before any rallies exist", () => {
    const pattern = computeProfileShape({}).insights[2]
    expect(pattern.title).toBe("Patterns take a little longer.")
    expect(pattern.body).not.toMatch(/\d/)
  })
})

describe("lede", () => {
  it("names the strength and the weakness", () => {
    const { lede } = computeProfileShape(player())
    expect(lede).toContain("never invented ratings")
    expect(lede).toContain("leans toward clutch")
    expect(lede).toContain("attack is where the work is")
  })
})
