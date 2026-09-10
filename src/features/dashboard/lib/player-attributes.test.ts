import { describe, expect, it } from "vitest"

import {
  TRAIT_META,
  computePlayerAttributes,
  heroStat,
  traitAt,
} from "@/features/dashboard/lib/player-attributes"
import {
  error,
  headline,
  player,
  rally,
} from "@/features/dashboard/lib/player-data.fixtures"

describe("computePlayerAttributes", () => {
  it("derives the six rates from the payloads", () => {
    const attrs = computePlayerAttributes(player())
    const byKey = Object.fromEntries(attrs.map((a) => [a.key, a]))
    expect(attrs.map((a) => a.key)).toEqual([
      "srv",
      "ret",
      "att",
      "con",
      "grd",
      "clu",
    ])
    expect(byKey.srv.value).toBe(58)
    expect(byKey.ret.value).toBe(47)
    expect(byKey.att.value).toBe(44) // 35/80
    expect(byKey.con.value).toBe(60) // 33/(33+22)
    expect(byKey.grd.value).toBe(54) // (40+25)/(80+40) extended rallies
    expect(byKey.clu.value).toBe(64) // 32/50
    expect(byKey.srv.display).toBe("58")
    expect(byKey.srv.sr).toBe("58 of 100 serve rallies won")
    expect(byKey.con.sr).toBe("33 of 55 tagged errors were forced")
  })

  it("holds back under-sampled rates as a dash, not a raw n=X", () => {
    const attrs = computePlayerAttributes(
      player({
        rally: rally({
          medium_rallies: 10,
          medium_wins: 5,
          long_rallies: 8,
          long_wins: 6,
        }),
        error: error({ forced_errors: 4, unforced_errors: 3 }),
      })
    )
    const byKey = Object.fromEntries(attrs.map((a) => [a.key, a]))
    expect(byKey.grd.value).toBeNull() // 18 extended rallies < 30
    expect(byKey.grd.display).toBe("—")
    expect(byKey.con.value).toBeNull()
    expect(byKey.con.display).toBe("—")
    expect(byKey.con.sr).toContain("only 7 tagged errors")
  })

  it("shows an em dash before any payload arrives", () => {
    const attrs = computePlayerAttributes({})
    expect(attrs.every((a) => a.value === null && a.display === "—")).toBe(true)
  })
})

describe("heroStat", () => {
  it("shows the win rate, per player", () => {
    expect(heroStat(player())).toEqual({ display: "60%", label: "Win rate" }) // 24/40
    expect(heroStat({}).display).toBe("—")
    expect(
      heroStat({ headline: headline({ games_won: 2, games_decided: 3 }) })
        .display
    ).toBe("—") // under threshold
  })
})

describe("traitAt", () => {
  it("finds the trait in each corner of the matrix", () => {
    expect(traitAt("short", "finisher")).toBe("sniper")
    expect(traitAt("short", "pressure")).toBe("enforcer")
    expect(traitAt("long", "finisher")).toBe("hunter")
    expect(traitAt("long", "pressure")).toBe("wall")
  })

  it("finds the centre cell", () => {
    expect(traitAt("all", "mixed")).toBe("all_rounder")
  })

  // the /traits grid renders one cell per pair and single-sources from
  // TRAIT_META, so every pair must resolve and no trait may be orphaned
  it("covers all nine cells exactly once", () => {
    const tempos = ["short", "all", "long"] as const
    const agencies = ["finisher", "mixed", "pressure"] as const
    const found = tempos.flatMap((t) => agencies.map((a) => traitAt(t, a)))
    expect(found).toHaveLength(9)
    expect(new Set(found).size).toBe(9)
    expect(new Set(found)).toEqual(new Set(Object.keys(TRAIT_META)))
  })
})
