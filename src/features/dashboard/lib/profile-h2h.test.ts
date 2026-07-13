import { describe, expect, it } from "vitest"

import { computeH2h } from "@/features/dashboard/lib/profile-h2h"

import type { MatchResultSummary } from "@/lib/schemas/match"

const ME = "00000000-0000-0000-0000-000000000001"
const RIVAL_A = "00000000-0000-0000-0000-00000000000a"
const RIVAL_B = "00000000-0000-0000-0000-00000000000b"

const NAMES: Record<string, string> = { [RIVAL_A]: "Ormond", [RIVAL_B]: "Alex" }
const nameOf = (id: string) => NAMES[id] ?? "Unknown"

let seq = 0
function match(over: Partial<MatchResultSummary>): MatchResultSummary {
  seq += 1
  return {
    match_id: `00000000-0000-0000-0000-0000000000${String(seq).padStart(2, "0")}`,
    date: "2026-07-01",
    player1_id: ME,
    player2_id: RIVAL_A,
    games_won_p1: 3,
    games_won_p2: 1,
    match_winner_id: ME,
    ball_type: null,
    ...over,
  }
}

describe("computeH2h", () => {
  it("aggregates match and game records per rival, player first", () => {
    const { rows } = computeH2h(
      ME,
      [
        match({ date: "2026-07-04", games_won_p1: 3, games_won_p2: 1 }),
        // seen from the other side of the net
        match({
          date: "2026-07-02",
          player1_id: RIVAL_A,
          player2_id: ME,
          games_won_p1: 3,
          games_won_p2: 2,
          match_winner_id: RIVAL_A,
        }),
      ],
      nameOf
    )
    expect(rows).toEqual([
      {
        rival: "Ormond",
        matches: "1–1",
        games: "5–4",
        share: 56,
        lastWon: true,
      },
    ])
  })

  it("takes the last result from the newest decided match", () => {
    const { rows } = computeH2h(
      ME,
      [
        match({ date: "2026-06-01", match_winner_id: ME }),
        match({
          date: "2026-07-09",
          games_won_p1: 1,
          games_won_p2: 3,
          match_winner_id: RIVAL_A,
        }),
      ],
      nameOf
    )
    expect(rows[0].lastWon).toBe(false)
  })

  it("keeps an undecided match out of the match record but counts its games", () => {
    const { rows } = computeH2h(
      ME,
      [
        match({ date: "2026-07-01" }),
        match({
          date: "2026-07-08",
          games_won_p1: 1,
          games_won_p2: 1,
          match_winner_id: null,
        }),
      ],
      nameOf
    )
    expect(rows[0].matches).toBe("1–0")
    expect(rows[0].games).toBe("4–2")
    expect(rows[0].lastWon).toBe(true) // the in-play match decides nothing
  })

  it("hides a rival with no decided match yet", () => {
    const { rows, read } = computeH2h(
      ME,
      [match({ match_winner_id: null, games_won_p1: 1, games_won_p2: 0 })],
      nameOf
    )
    expect(rows).toEqual([])
    expect(read).toContain("after the first decided match")
  })

  it("orders rivals by the size of the rivalry", () => {
    const { rows } = computeH2h(
      ME,
      [
        match({}), // Ormond: 4 games
        match({
          player2_id: RIVAL_B,
          games_won_p1: 3,
          games_won_p2: 2,
        }),
        match({
          player2_id: RIVAL_B,
          games_won_p1: 2,
          games_won_p2: 3,
          match_winner_id: RIVAL_B,
        }), // Alex: 10 games
      ],
      nameOf
    )
    expect(rows.map((r) => r.rival)).toEqual(["Alex", "Ormond"])
  })

  it("names the toughest rival when one is ahead of you", () => {
    const { read } = computeH2h(
      ME,
      [
        match({}),
        match({
          player2_id: RIVAL_B,
          games_won_p1: 1,
          games_won_p2: 3,
          match_winner_id: RIVAL_B,
        }),
      ],
      nameOf
    )
    expect(read).toBe(
      "Alex is the problem — winning just 25% of the games there."
    )
  })

  it("names the closest fight when ahead of everyone", () => {
    const { read } = computeH2h(
      ME,
      [
        match({ games_won_p1: 3, games_won_p2: 0 }),
        match({
          player2_id: RIVAL_B,
          games_won_p1: 3,
          games_won_p2: 2,
        }),
      ],
      nameOf
    )
    expect(read).toBe(
      "Ahead of every rival — Alex is the closest fight at 60% of the games."
    )
  })
})
