import { describe, expect, it } from "vitest"

import {
  dominanceFromForm,
  dominanceFromH2h,
  duelTally,
  superlatives,
} from "@/features/dashboard/lib/duel-scoring"
import { computePlayerAttributes } from "@/features/dashboard/lib/player-attributes"
import {
  error,
  headline,
  momentum,
  player,
  rally,
  serve,
} from "@/features/dashboard/lib/player-data.fixtures"

import type { H2hResult } from "@/features/dashboard/schemas/insights"

describe("duelTally", () => {
  it("scores only measured, non-tied rows", () => {
    const a1 = computePlayerAttributes(player())
    const a2 = computePlayerAttributes(
      player({
        serve: serve({ serve_wins: 62, return_wins: 47 }), // srv to p2, ret tied
        rally: rally({ short_wins: 30, long_wins: 40 }), // att to p1, grd to p2
        error: error({ forced_errors: 20 }), // con 48 → p1
        momentum: momentum({ close_wins: 20 }), // clu 40 → p1
      })
    )
    // p1 takes att, con, clu; p2 takes srv, grd; ret is tied
    expect(duelTally(a1, a2)).toEqual({ p1: 3, p2: 2 })
  })
})

describe("superlatives", () => {
  it("awards each category to the plainly higher side, capped at two", () => {
    const d1 = player()
    const d2 = player({
      serve: serve({ serve_wins: 70 }), // big server → p2
      momentum: momentum({ comebacks: 1, close_wins: 20 }), // comeback king + iron nerve → p1
      rally: rally({ short_wins: 50, longest: 40 }), // shot machine → p2 (cap reached before marathon man)
    })
    const result = superlatives(
      d1,
      d2,
      computePlayerAttributes(d1),
      computePlayerAttributes(d2)
    )
    expect(result.p1).toEqual(["Comeback king", "Iron nerve"])
    expect(result.p2).toEqual(["Big server", "Shot machine"])
  })

  it("awards nobody on ties or missing data", () => {
    const d = player()
    const result = superlatives(
      d,
      d,
      computePlayerAttributes(d),
      computePlayerAttributes(d)
    )
    expect(result).toEqual({ p1: [], p2: [] })
  })
})

describe("dominance", () => {
  const h2h = (p1: number, p2: number): H2hResult => ({
    games_won_p1: p1,
    games_won_p2: p2,
    games_decided: p1 + p2,
    matches_won_p1: 0,
    matches_won_p2: 0,
    matches_decided: 0,
    match_history: [],
  })

  it("splits head-to-head dominance by shared games", () => {
    expect(dominanceFromH2h(h2h(11, 9))).toBeCloseTo(0.55)
    expect(dominanceFromH2h(h2h(0, 0))).toBeNull()
  })

  it("normalises all-mode dominance from win rates, guarded by sample", () => {
    const h1 = headline({ games_won: 30, games_decided: 40 }) // 0.75
    const h2 = headline({ games_won: 10, games_decided: 40 }) // 0.25
    expect(dominanceFromForm(h1, h2)).toBeCloseTo(0.75)
    expect(
      dominanceFromForm(h1, headline({ games_decided: 3, games_won: 2 }))
    ).toBeNull()
    expect(dominanceFromForm(undefined, h2)).toBeNull()
    expect(
      dominanceFromForm(
        headline({ games_won: 0, games_decided: 10 }),
        headline({ games_won: 0, games_decided: 10 })
      )
    ).toBeNull()
  })
})
