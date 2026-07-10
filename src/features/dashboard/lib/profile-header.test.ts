import { describe, expect, it } from "vitest"

import * as fx from "@/features/dashboard/lib/player-data.fixtures"
import { computeProfileHeader } from "@/features/dashboard/lib/profile-header"

import type { PlayerSummary } from "@/lib/schemas/player"

const player = (over: Partial<PlayerSummary> = {}): PlayerSummary => ({
  id: "00000000-0000-0000-0000-000000000001",
  name: "Sam",
  handedness: "right",
  avatar_url: null,
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

  it("shows the win-rate KPI once enough games are decided", () => {
    const header = computeProfileHeader(
      player(),
      fx.player({ headline: fx.headline({ games_won: 6, games_decided: 10 }) })
    )
    const wr = kpi(header, "Win rate")
    expect(wr.value).toBe("60%")
    expect(wr.detail).toBe("6–4 games")
  })

  it("dashes the win-rate KPI below the games threshold", () => {
    const header = computeProfileHeader(
      player(),
      fx.player({ headline: fx.headline({ games_won: 2, games_decided: 3 }) })
    )
    expect(kpi(header, "Win rate").value).toBe("—")
  })

  it("dashes the errors-forced KPI below the tagged-error threshold", () => {
    const header = computeProfileHeader(
      player(),
      fx.player({ error: fx.error({ forced_errors: 5, unforced_errors: 4 }) })
    )
    // 9 tagged < MIN_ERRORS_FOR_RATE (15) — dash, but the denominator still shows
    const ef = kpi(header, "Errors forced")
    expect(ef.value).toBe("—")
    expect(ef.detail).toBe("5 of 9 tagged")
  })

  it("dashes every KPI when the payloads have not arrived", () => {
    const header = computeProfileHeader(player(), {})
    expect(header.kpis.every((k) => k.value === "—")).toBe(true)
  })
})
