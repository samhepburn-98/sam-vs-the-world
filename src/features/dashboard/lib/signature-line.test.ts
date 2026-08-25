import { describe, expect, it } from "vitest"

import { signatureLine } from "./player-attributes"

import type {
  PlayerHeadline,
  RallyLengths,
} from "@/features/dashboard/schemas/insights"

const headline = (
  trait: PlayerHeadline["signature_trait"],
  over: Partial<PlayerHeadline> = {}
) =>
  ({
    signature_trait: trait,
    clean_finish_wins: 0,
    points_won: 0,
    ...over,
  }) as PlayerHeadline

const lengths = (over: Partial<RallyLengths>) =>
  ({
    short_wins: 0,
    short_rallies: 0,
    medium_wins: 0,
    medium_rallies: 0,
    long_wins: 0,
    long_rallies: 0,
    ...over,
  }) as RallyLengths

describe("signatureLine", () => {
  it("cites the grinder's extended-rally win rate", () => {
    expect(
      signatureLine(
        headline("grinder"),
        lengths({
          medium_wins: 15,
          medium_rallies: 20,
          long_wins: 6,
          long_rallies: 10,
        })
      )
    ).toBe("Grinder — wins 70% of 5+ shot rallies")
  })

  it("cites the shotmaker's short-rally win rate", () => {
    expect(
      signatureLine(
        headline("shotmaker"),
        lengths({ short_wins: 18, short_rallies: 30 })
      )
    ).toBe("Shotmaker — wins 60% of 1–3 shot rallies")
  })

  it("cites both axes for a corner trait", () => {
    expect(
      signatureLine(
        headline("sniper", { clean_finish_wins: 33, points_won: 55 }),
        lengths({ short_wins: 18, short_rallies: 30 })
      )
    ).toBe("Sniper — wins 60% of 1–3 shot rallies, 60% on clean winners")
  })

  it("cites the given share for a pressure trait", () => {
    expect(
      signatureLine(
        headline("wall", { clean_finish_wins: 20, points_won: 100 }),
        lengths({
          medium_wins: 12,
          medium_rallies: 20,
          long_wins: 3,
          long_rallies: 5,
        })
      )
    ).toBe("Wall — wins 60% of 5+ shot rallies, 80% off opponent errors")
  })

  it("states the all-rounder's absence of lean plainly", () => {
    expect(signatureLine(headline("all_rounder"), lengths({}))).toBe(
      "All-Rounder — no clear lean by rally length or finish"
    )
  })

  it("is omitted when the trait is null", () => {
    expect(signatureLine(headline(null), lengths({}))).toBeNull()
  })

  it("falls back to prose when a cited bucket has no rallies to rate", () => {
    expect(signatureLine(headline("grinder"), lengths({}))).toBe(
      "Grinder — stronger the longer the rally"
    )
  })

  it("falls back to prose when the agency share has no points to rate", () => {
    expect(
      signatureLine(
        headline("marksman", { clean_finish_wins: 0, points_won: 0 }),
        lengths({})
      )
    ).toBe("Marksman — finishes points personally at any length")
  })
})
