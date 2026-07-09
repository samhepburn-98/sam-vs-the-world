import { describe, expect, it } from "vitest"

import {
  computeDuelAttributes,
  dominanceFromForm,
  dominanceFromH2h,
  duelTally,
  heroStat,
  superlatives,
} from "@/features/dashboard/lib/duel-attributes"

import type { PlayerData } from "@/features/dashboard/lib/duel-attributes"
import type {
  ErrorProfile,
  H2hResult,
  Momentum,
  PlayerHeadline,
  RallyLengths,
  ServeStats,
} from "@/features/dashboard/schemas/insights"

const serve = (over: Partial<ServeStats> = {}): ServeStats => ({
  rallies_served: 100,
  serve_wins: 58,
  rallies_returned: 100,
  return_wins: 47,
  aces: 6,
  double_faults: 2,
  two_serve_rallies_served: 0,
  first_serve_faults: 0,
  serve1_served: 0,
  serve1_wins: 0,
  serve2_served: 0,
  serve2_wins: 0,
  left_served: 50,
  left_wins: 30,
  right_served: 50,
  right_wins: 28,
  ...over,
})

const rally = (over: Partial<RallyLengths> = {}): RallyLengths => ({
  total_rallies: 200,
  avg_length: 8.42,
  longest: 34,
  short_rallies: 80,
  short_wins: 35,
  medium_rallies: 80,
  medium_wins: 40,
  long_rallies: 40,
  long_wins: 25,
  ...over,
})

const error = (over: Partial<ErrorProfile> = {}): ErrorProfile => ({
  errors_total: 60,
  forced_errors: 33,
  unforced_errors: 22,
  untagged_errors: 5,
  tin: 20,
  out_top: 10,
  out_side: 8,
  out_back: 6,
  not_up: 10,
  detail_untagged: 6,
  games_played: 12,
  trend: [],
  ...over,
})

const momentum = (over: Partial<Momentum> = {}): Momentum => ({
  comebacks: 3,
  longest_streak: 6,
  longest_streak_game_id: null,
  early_rallies: 100,
  early_wins: 52,
  mid_rallies: 80,
  mid_wins: 40,
  close_rallies: 50,
  close_wins: 32,
  comeback_games: [],
  ...over,
})

const headline = (over: Partial<PlayerHeadline> = {}): PlayerHeadline => ({
  player_id: "00000000-0000-0000-0000-000000000001",
  games_won: 24,
  games_decided: 40,
  matches_won: 7,
  matches_decided: 12,
  signature_trait: "grinder",
  recent_games: [],
  ...over,
})

const player = (over: Partial<PlayerData> = {}): PlayerData => ({
  headline: headline(),
  serve: serve(),
  error: error(),
  rally: rally(),
  momentum: momentum(),
  ...over,
})

describe("computeDuelAttributes", () => {
  it("derives the six rates from the payloads", () => {
    const attrs = computeDuelAttributes(player())
    const byKey = Object.fromEntries(attrs.map((a) => [a.key, a]))
    expect(attrs.map((a) => a.key)).toEqual(["srv", "ret", "att", "con", "grd", "clu"])
    expect(byKey.srv.value).toBe(58)
    expect(byKey.ret.value).toBe(47)
    expect(byKey.att.value).toBe(44) // 35/80
    expect(byKey.con.value).toBe(60) // 33/(33+22)
    expect(byKey.grd.value).toBe(63) // 25/40
    expect(byKey.clu.value).toBe(64) // 32/50
    expect(byKey.srv.display).toBe("58")
    expect(byKey.srv.sr).toBe("58 of 100 serve rallies won")
    expect(byKey.con.sr).toBe("33 of 55 tagged errors were forced")
  })

  it("holds back under-sampled rates as n=X", () => {
    const attrs = computeDuelAttributes(
      player({
        rally: rally({ long_rallies: 8, long_wins: 6 }),
        error: error({ forced_errors: 4, unforced_errors: 3 }),
      }),
    )
    const byKey = Object.fromEntries(attrs.map((a) => [a.key, a]))
    expect(byKey.grd.value).toBeNull()
    expect(byKey.grd.display).toBe("n=8")
    expect(byKey.con.value).toBeNull()
    expect(byKey.con.display).toBe("n=7")
  })

  it("shows an em dash before any payload arrives", () => {
    const attrs = computeDuelAttributes({})
    expect(attrs.every((a) => a.value === null && a.display === "—")).toBe(true)
  })
})

describe("duelTally", () => {
  it("scores only measured, non-tied rows", () => {
    const a1 = computeDuelAttributes(player())
    const a2 = computeDuelAttributes(
      player({
        serve: serve({ serve_wins: 62, return_wins: 47 }), // srv to p2, ret tied
        rally: rally({ short_wins: 30, long_rallies: 8 }), // att to p1, grd unmeasured
        error: error({ forced_errors: 20 }), // con 48 → p1
        momentum: momentum({ close_wins: 20 }), // clu 40 → p1
      }),
    )
    expect(duelTally(a1, a2)).toEqual({ p1: 3, p2: 1 })
  })
})

describe("heroStat", () => {
  it("formats the average rally", () => {
    expect(heroStat(player())).toEqual({ display: "8.4", label: "Avg rally" })
    expect(heroStat({}).display).toBe("—")
    expect(heroStat({ rally: rally({ avg_length: null }) }).display).toBe("—")
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
    const result = superlatives(d1, d2, computeDuelAttributes(d1), computeDuelAttributes(d2))
    expect(result.p1).toEqual(["Comeback king", "Iron nerve"])
    expect(result.p2).toEqual(["Big server", "Shot machine"])
  })

  it("awards nobody on ties or missing data", () => {
    const d = player()
    const result = superlatives(d, d, computeDuelAttributes(d), computeDuelAttributes(d))
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
    expect(dominanceFromForm(h1, headline({ games_decided: 3, games_won: 2 }))).toBeNull()
    expect(dominanceFromForm(undefined, h2)).toBeNull()
    expect(
      dominanceFromForm(
        headline({ games_won: 0, games_decided: 10 }),
        headline({ games_won: 0, games_decided: 10 }),
      ),
    ).toBeNull()
  })
})
