import { describe, expect, it } from "vitest"

import * as fx from "@/features/dashboard/lib/player-data.fixtures"
import { computeProfileHeader } from "@/features/dashboard/lib/profile-header"

import type { PlayerSummary } from "@/lib/schemas/player"

const player = (over: Partial<PlayerSummary> = {}): PlayerSummary => ({
  id: "00000000-0000-0000-0000-000000000001",
  name: "Sam",
  handedness: "right",
  avatar_url: null,
  is_protagonist: false,
  ...over,
})

const kpi = (header: ReturnType<typeof computeProfileHeader>, label: string) =>
  header.kpis.find((k) => k.label === label)!

describe("computeProfileHeader", () => {
  it("carries identity straight through", () => {
    const header = computeProfileHeader(player({ name: "Woody" }), fx.player())
    expect(header.name).toBe("Woody")
    expect(header.handedness).toBe("right")
  })

  it("falls back to the silhouette when no avatar is set", () => {
    expect(computeProfileHeader(player(), fx.player()).avatarSrc).toBe(
      "/avatars/default.svg"
    )
  })

  it("builds the meta line from handedness and decided counts", () => {
    const header = computeProfileHeader(
      player({ handedness: "left" }),
      fx.player({
        headline: fx.headline({ games_decided: 40, matches_decided: 12 }),
      })
    )
    expect(header.meta).toBe("Left-handed · 40 games across 12 matches")
  })

  it("omits handedness from the meta when it is unknown", () => {
    const header = computeProfileHeader(
      player({ handedness: null }),
      fx.player()
    )
    expect(header.meta).not.toContain("handed")
    expect(header.meta).toContain("games across")
  })

  it("strips the trait prefix from the signature (the chip carries it)", () => {
    const header = computeProfileHeader(
      player(),
      fx.player({
        headline: fx.headline({ signature_trait: "shotmaker" }),
        rally: fx.rally({ short_wins: 18, short_rallies: 30 }),
      })
    )
    expect(header.trait).toBe("shotmaker")
    expect(header.signature).toBe("Wins 60% of 1–3 shot rallies")
  })

  it("shows the games record as a count, not the win rate", () => {
    const header = computeProfileHeader(
      player(),
      fx.player({ headline: fx.headline({ games_won: 8, games_decided: 19 }) })
    )
    // win rate lives on the card's hero — the row shows the raw record behind it
    expect(header.kpis.some((k) => k.label === "Win rate")).toBe(false)
    const g = kpi(header, "Games")
    expect(g.value).toBe("8–11")
    expect(g.detail).toBe("19 decided")
  })

  it("grows the match record's third figure from drawn sessions", () => {
    const header = computeProfileHeader(
      player(),
      fx.player({
        headline: fx.headline({ matches_won: 12, matches_decided: 17 }),
      }),
      2
    )
    const m = kpi(header, "Matches")
    expect(m.value).toBe("12–5–2")
    expect(m.detail).toBe("17 decided · 2 drawn")
  })

  it("keeps the match record two-figured while no session has been drawn", () => {
    const header = computeProfileHeader(
      player(),
      fx.player({
        headline: fx.headline({ matches_won: 12, matches_decided: 17 }),
      })
    )
    const m = kpi(header, "Matches")
    expect(m.value).toBe("12–5")
    expect(m.detail).toBe("17 decided")
  })

  it("shows aces with double faults, and no errors-forced rate (the card's CON)", () => {
    const header = computeProfileHeader(
      player(),
      fx.player({ serve: fx.serve({ aces: 6, double_faults: 4 }) })
    )
    expect(header.kpis.some((k) => k.label === "Errors forced")).toBe(false)
    const a = kpi(header, "Aces")
    expect(a.value).toBe("6")
    expect(a.detail).toBe("4 double faults")
  })

  it("dashes every KPI when the payloads have not arrived", () => {
    const header = computeProfileHeader(player(), {})
    expect(header.kpis.every((k) => k.value === "—")).toBe(true)
  })
})
