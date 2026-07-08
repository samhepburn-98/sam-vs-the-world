import { describe, expect, it } from "vitest"

import {
  buildMatchStory,
  computeErrorBreakdown,
  computePointSources,
  computeRallyLengthSplit,
  computeServeInsights,
  computeWinningShots,
  earnedShare,
  rate,
} from "./match-insights"

import type { RallyScored } from "@/lib/schemas/rally"

const P1 = "11111111-1111-1111-1111-111111111111"
const P2 = "22222222-2222-2222-2222-222222222222"

function rally(over: Partial<RallyScored>): RallyScored {
  return {
    rally_number: 1,
    player1_id: P1,
    player2_id: P2,
    server_id: P1,
    serve_side: "left",
    winner_id: P1,
    end_reason: "winner",
    error_detail: null,
    forced: null,
    shot_type: null,
    shot_count: 3,
    ...over,
  } as RallyScored
}

describe("computePointSources", () => {
  it("splits each player's points into earned and gifted buckets", () => {
    const rows = [
      rally({ end_reason: "winner", winner_id: P1 }),
      rally({ end_reason: "ace", winner_id: P1 }),
      // P2's error under pressure — P1 earned it
      rally({ end_reason: "error", winner_id: P1, forced: true }),
      // P2's unforced — a gift
      rally({ end_reason: "error", winner_id: P1, forced: false }),
      // a serve fault is self-inflicted: a gift to P1
      rally({ end_reason: "serve_fault", winner_id: P1, server_id: P2 }),
      // untagged error — counted apart, not guessed
      rally({ end_reason: "error", winner_id: P1, forced: null }),
      rally({ end_reason: "stroke", winner_id: P1 }),
      rally({ end_reason: "winner", winner_id: P2 }),
      // a let contributes nothing
      rally({ end_reason: "let", winner_id: null }),
    ]
    const s = computePointSources(rows, P1)
    expect(s.p1).toEqual({
      ownWinner: 2,
      forced: 1,
      unforced: 2,
      untagged: 1,
      stroke: 1,
      total: 7,
    })
    expect(s.p2.ownWinner).toBe(1)
    expect(s.p2.total).toBe(1)
  })

  it("earnedShare is winners + forced over total, null on no points", () => {
    expect(
      earnedShare({
        ownWinner: 3,
        forced: 1,
        unforced: 4,
        untagged: 0,
        stroke: 0,
        total: 8,
      })
    ).toBeCloseTo(0.5)
    expect(
      earnedShare({
        ownWinner: 0,
        forced: 0,
        unforced: 0,
        untagged: 0,
        stroke: 0,
        total: 0,
      })
    ).toBeNull()
  })
})

describe("computeRallyLengthSplit", () => {
  it("buckets decided rallies by shot count, excluding untagged honestly", () => {
    const rows = [
      rally({ shot_count: 1, winner_id: P1 }),
      rally({ shot_count: 4, winner_id: P2, end_reason: "error" }),
      rally({ shot_count: 5, winner_id: P1 }),
      rally({ shot_count: 9, winner_id: P1 }),
      rally({ shot_count: 10, winner_id: P2 }),
      rally({ shot_count: 25, winner_id: P1 }),
      rally({ shot_count: null, winner_id: P1, end_reason: "stroke" }),
      rally({ shot_count: null, winner_id: null, end_reason: "let" }),
    ]
    const split = computeRallyLengthSplit(rows, P1)
    expect(split.buckets[0].won).toEqual({ p1: 1, p2: 1 })
    expect(split.buckets[1].won).toEqual({ p1: 2, p2: 0 })
    expect(split.buckets[2].won).toEqual({ p1: 1, p2: 1 })
    expect(split.untagged).toBe(1) // the stroke; the let is not decided
  })
})

describe("computeServeInsights", () => {
  it("tracks serve vs return and the box the serve came from", () => {
    const rows = [
      // P1 serves from the left and holds
      rally({ server_id: P1, serve_side: "left", winner_id: P1 }),
      // P1 serves from the right and loses the point
      rally({
        server_id: P1,
        serve_side: "right",
        winner_id: P2,
        end_reason: "error",
      }),
      // P2 serves and P1 breaks — a return point for P1
      rally({ server_id: P2, serve_side: "left", winner_id: P1 }),
    ]
    const s = computeServeInsights(rows, P1)
    expect(s.p1.serve).toEqual({ won: 1, total: 2 })
    expect(s.p1.leftBox).toEqual({ won: 1, total: 1 })
    expect(s.p1.rightBox).toEqual({ won: 0, total: 1 })
    expect(s.p1.ret).toEqual({ won: 1, total: 1 })
    expect(s.p2.serve).toEqual({ won: 0, total: 1 })
    expect(s.p2.ret).toEqual({ won: 1, total: 2 })
    expect(rate(s.p1.serve)).toBeCloseTo(0.5)
    expect(rate({ won: 0, total: 0 })).toBeNull()
  })
})

describe("computeErrorBreakdown", () => {
  it("attributes errors to their maker, grouped by destination", () => {
    const rows = [
      // P2's errors (P1 won the point)
      rally({
        end_reason: "error",
        winner_id: P1,
        error_detail: "tin",
        forced: false,
      }),
      rally({
        end_reason: "error",
        winner_id: P1,
        error_detail: "out_top",
        forced: false,
      }),
      rally({
        end_reason: "error",
        winner_id: P1,
        error_detail: "out_back",
        forced: true,
      }),
      rally({
        end_reason: "error",
        winner_id: P1,
        error_detail: "not_up",
        forced: null,
      }),
      rally({ end_reason: "error", winner_id: P1, error_detail: null }),
      // P1's serve fault (an error of P1's, point to P2)
      rally({
        end_reason: "serve_fault",
        winner_id: P2,
        server_id: P1,
        error_detail: "out_side",
      }),
      // winners are not errors
      rally({ end_reason: "winner", winner_id: P1 }),
    ]
    const e = computeErrorBreakdown(rows, P1)
    expect(e.p2).toEqual({
      tin: 1,
      out: 2,
      notUp: 1,
      other: 1,
      unforced: 2,
      total: 5,
    })
    expect(e.p1).toEqual({
      tin: 0,
      out: 1,
      notUp: 0,
      other: 0,
      unforced: 0,
      total: 1,
    })
  })
})

describe("computeWinningShots", () => {
  it("ranks typed winners, counts untyped apart, ties break alphabetically", () => {
    const rows = [
      rally({ end_reason: "winner", winner_id: P1, shot_type: "drop" }),
      rally({ end_reason: "winner", winner_id: P1, shot_type: "drop" }),
      rally({ end_reason: "winner", winner_id: P1, shot_type: "kill" }),
      rally({ end_reason: "winner", winner_id: P1, shot_type: "boast" }),
      rally({ end_reason: "winner", winner_id: P1, shot_type: null }),
      rally({ end_reason: "error", winner_id: P1 }),
      rally({ end_reason: "winner", winner_id: P2, shot_type: "drive" }),
    ]
    const w = computeWinningShots(rows, P1)
    expect(w.p1.shots).toEqual([
      { shot: "drop", count: 2 },
      { shot: "boast", count: 1 },
      { shot: "kill", count: 1 },
    ])
    expect(w.p1.untyped).toBe(1)
    expect(w.p1.total).toBe(5)
    expect(w.p2.shots).toEqual([{ shot: "drive", count: 1 }])
  })
})

describe("buildMatchStory", () => {
  const winners = (n: number, winner_id: string) =>
    Array.from({ length: n }, () => rally({ end_reason: "winner", winner_id }))
  const gifts = (n: number, to: string) =>
    Array.from({ length: n }, () =>
      rally({ end_reason: "error", winner_id: to, forced: false })
    )

  it("returns null when the match is level or the sample is tiny", () => {
    expect(buildMatchStory([], P1, "Sam", "Dave")).toBeNull()
    expect(
      buildMatchStory(
        [...winners(12, P1), ...winners(12, P2)],
        P1,
        "Sam",
        "Dave"
      )
    ).toBeNull()
    expect(
      buildMatchStory([...winners(5, P1), ...winners(2, P2)], P1, "Sam", "Dave")
    ).toBeNull()
  })

  it("leads with the crossover when the loser earned more of their points", () => {
    // Dave earns all 20 of his points; Sam wins on 25 gifts + 5 winners
    const rows = [...winners(20, P2), ...winners(5, P1), ...gifts(25, P1)]
    const story = buildMatchStory(rows, P1, "Sam", "Dave")
    expect(story).toContain("Dave played the better squash")
    expect(story).toContain("handed Sam 25 unforced errors")
  })

  it("is deterministic", () => {
    const rows = [...winners(20, P1), ...gifts(10, P1), ...winners(8, P2)]
    expect(buildMatchStory(rows, P1, "Sam", "Dave")).toBe(
      buildMatchStory(rows, P1, "Sam", "Dave")
    )
  })

  it("always ends with a factual fallback for a decided match", () => {
    const rows = [...winners(15, P1), ...winners(10, P2)]
    const story = buildMatchStory(rows, P1, "Sam", "Dave")
    expect(story).not.toBeNull()
  })
})

describe("takeaways stay silent below their thresholds", async () => {
  const {
    computeErrorBreakdown: errFn,
    computeServeInsights: serveFn,
    errorTakeaway,
    serveTakeaway,
    grindTakeaway,
  } = await import("./match-insights")

  it("errorTakeaway names the tin problem only past 10 errors, half down", () => {
    const tins = Array.from({ length: 12 }, () =>
      rally({
        end_reason: "error",
        winner_id: P1,
        error_detail: "tin",
        forced: false,
      })
    )
    expect(errorTakeaway(errFn(tins, P1), "Sam", "Dave")).toBe(
      "Dave tinned 12 balls — 100% of their errors went down."
    )
    expect(errorTakeaway(errFn(tins.slice(0, 5), P1), "Sam", "Dave")).toBeNull()
  })

  it("serveTakeaway needs 8+ serves per box and a 20-point gap", () => {
    const rows = [
      // Sam: right box strong (8/8), left box weak (2/8)
      ...Array.from({ length: 8 }, () =>
        rally({ server_id: P1, serve_side: "right", winner_id: P1 })
      ),
      ...Array.from({ length: 2 }, () =>
        rally({ server_id: P1, serve_side: "left", winner_id: P1 })
      ),
      ...Array.from({ length: 6 }, () =>
        rally({
          server_id: P1,
          serve_side: "left",
          winner_id: P2,
          end_reason: "error",
        })
      ),
    ]
    expect(serveTakeaway(serveFn(rows, P1), "Sam", "Dave")).toBe(
      "Sam serves best from the right box — 100% against 25% from the left."
    )
    expect(
      serveTakeaway(serveFn(rows.slice(0, 9), P1), "Sam", "Dave")
    ).toBeNull()
  })

  it("grindTakeaway needs 8+ long rallies and 70% dominance", () => {
    const long = (n: number, winner_id: string) =>
      Array.from({ length: n }, () => rally({ shot_count: 12, winner_id }))
    expect(
      grindTakeaway(
        computeRallyLengthSplit([...long(7, P1), ...long(1, P2)], P1),
        "Sam",
        "Dave"
      )
    ).toBe("Sam owns the long rallies — 88% of everything past 9 shots.")
    expect(
      grindTakeaway(
        computeRallyLengthSplit([...long(4, P1), ...long(3, P2)], P1),
        "Sam",
        "Dave"
      )
    ).toBeNull()
  })
})
