import { describe, expect, it } from "vitest"

import {
  formFor,
  tickerDate,
  tickerLine,
} from "@/features/dashboard/lib/rundown"

import type { MatchResultSummary } from "@/lib/schemas/match"

const SAM = "sam-id"
const ALEX = "alex-id"
const names = new Map([
  [SAM, "Sam"],
  [ALEX, "Alex"],
])

function match(over: Partial<MatchResultSummary> = {}): MatchResultSummary {
  return {
    match_id: "m1",
    date: "2026-07-14",
    player1_id: SAM,
    player2_id: ALEX,
    games_won_p1: 0,
    games_won_p2: 6,
    match_winner_id: ALEX,
    ball_type: "blue",
    venue: "Hallamshire",
    outcome: "p2",
    ...over,
  }
}

describe("tickerDate", () => {
  it("reads the day and month off the ISO parts", () => {
    expect(tickerDate("2026-07-14")).toBe("14 Jul")
    expect(tickerDate("2026-01-01")).toBe("1 Jan")
    expect(tickerDate("2026-12-31")).toBe("31 Dec")
  })

  // The reason this is parsed by parts: `new Date("2026-07-14")` is UTC
  // midnight, so `getDate()` returns the 13th anywhere west of Greenwich.
  // Asserting against that construction pins the difference — a rewrite
  // that reached for Date would fail here rather than only in California.
  it("reads the calendar date, not the local-time date", () => {
    const iso = "2026-07-14"
    const viaDate = new Date(iso)
    expect(tickerDate(iso)).toBe("14 Jul")
    expect(Number(iso.split("-")[2])).toBe(14)
    // documents the trap rather than depending on the runner's timezone
    expect(viaDate.getUTCDate()).toBe(14)
  })
})

describe("tickerLine", () => {
  it("puts the winner first whichever side won", () => {
    expect(tickerLine(match(), names)).toBe("Alex beat Sam 6–0")
    expect(
      tickerLine(
        match({ outcome: "p1", games_won_p1: 6, games_won_p2: 1 }),
        names
      )
    ).toBe("Sam beat Alex 6–1")
  })

  it("reads a draw from the first-named player's side", () => {
    expect(
      tickerLine(
        match({ outcome: "draw", games_won_p1: 3, games_won_p2: 3 }),
        names
      )
    ).toBe("Sam 3–3 Alex · drawn")
  })

  it("names no winner while a match is still being logged", () => {
    expect(tickerLine(match({ outcome: "pending" }), names)).toBe(
      "In play · Sam v Alex"
    )
  })

  it("falls back rather than throwing on an unknown player", () => {
    expect(tickerLine(match(), new Map())).toBe("Unknown beat Unknown 6–0")
  })
})

describe("formFor", () => {
  // the fetcher returns newest first; the strip reads oldest first
  const results = [
    match({ match_id: "m3", outcome: "p2" }), // Sam lost
    match({ match_id: "m2", outcome: "draw" }), // drawn
    match({ match_id: "m1", outcome: "p1" }), // Sam won
  ]

  it("reverses to oldest-first and orients to the player asked for", () => {
    expect(formFor(SAM, results)).toEqual(["w", "d", "l"])
    expect(formFor(ALEX, results)).toEqual(["l", "d", "w"])
  })

  it("drops matches the player wasn't in", () => {
    expect(formFor("someone-else", results)).toEqual([])
  })

  it("drops pending matches rather than showing a gap", () => {
    expect(formFor(SAM, [match({ outcome: "pending" })])).toEqual([])
  })

  it("orients correctly when the player is player two", () => {
    const asP2 = [match({ player1_id: ALEX, player2_id: SAM, outcome: "p2" })]
    expect(formFor(SAM, asP2)).toEqual(["w"])
  })
})
