import { describe, expect, it } from "vitest"

import { signatureLine } from "./player-attributes"

import type {
  PlayerHeadline,
  RallyLengths,
} from "@/features/dashboard/schemas/insights"

const headline = (trait: PlayerHeadline["signature_trait"]) =>
  ({ signature_trait: trait }) as PlayerHeadline

const lengths = (over: Partial<RallyLengths>) =>
  ({
    short_wins: 0,
    short_rallies: 0,
    long_wins: 0,
    long_rallies: 0,
    ...over,
  }) as RallyLengths

describe("signatureLine", () => {
  it("names the grinder's long-rally win rate", () => {
    expect(
      signatureLine(
        headline("grinder"),
        lengths({ long_wins: 21, long_rallies: 30 })
      )
    ).toBe("Grinder — wins 70% of 9+ shot rallies")
  })

  it("names the shotmaker's short-rally win rate", () => {
    expect(
      signatureLine(
        headline("shotmaker"),
        lengths({ short_wins: 18, short_rallies: 30 })
      )
    ).toBe("Shotmaker — wins 60% of 1–3 shot rallies")
  })

  it("states balanced plainly", () => {
    expect(signatureLine(headline("balanced"), lengths({}))).toBe(
      "Balanced — no clear long- or short-rally edge"
    )
  })

  it("is omitted when the trait is null", () => {
    expect(signatureLine(headline(null), lengths({}))).toBeNull()
  })

  it("falls back to prose when the bucket has no rallies to rate", () => {
    expect(
      signatureLine(headline("grinder"), lengths({ long_rallies: 0 }))
    ).toBe("Grinder — stronger the longer the rally")
  })
})
