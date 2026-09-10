import { describe, expect, it } from "vitest"

import { houseRulesOf, toSessionRow } from "./match-detail"

import type { MatchDetail } from "@/lib/schemas/match"

const rally = {
  id: "r1",
  game_id: "g1",
  rally_number: 1,
  server_id: "sam",
  serve_side: "left" as const,
  serve_number: 1,
  winner_id: "sam",
  end_reason: "winner" as const,
  error_detail: null,
  forced: null,
  winning_shot: null,
  losing_shot: null,
  shot_count: 3,
}

describe("toSessionRow", () => {
  it("passes every field through untouched", () => {
    expect(toSessionRow(rally)).toEqual(rally)
  })

  // the column is a smallint the DB constrains, but the generated type says
  // `number` — so the narrowing happens once, here, on the way in
  it("narrows serve_number: only 2 is a second serve", () => {
    expect(toSessionRow({ ...rally, serve_number: 1 }).serve_number).toBe(1)
    expect(toSessionRow({ ...rally, serve_number: 2 }).serve_number).toBe(2)
  })

  it("carries a let through with its null winner", () => {
    const let_ = { ...rally, winner_id: null, end_reason: "let" as const }
    expect(toSessionRow(let_).winner_id).toBeNull()
    expect(toSessionRow(let_).end_reason).toBe("let")
  })
})

describe("houseRulesOf", () => {
  const match = {
    target_score: 11,
    tiebreak: "win_by_2",
    serves_per_point: 2,
    let_resets_serve: false,
  } as MatchDetail

  it("reads the rules off the match", () => {
    expect(houseRulesOf(match)).toEqual({
      targetScore: 11,
      tiebreak: "win_by_2",
      servesPerPoint: 2,
      letResetsServe: false,
    })
  })

  it("narrows servesPerPoint: only 1 is single-serve", () => {
    expect(houseRulesOf({ ...match, serves_per_point: 1 }).servesPerPoint).toBe(
      1
    )
    expect(houseRulesOf({ ...match, serves_per_point: 2 }).servesPerPoint).toBe(
      2
    )
  })

  it("carries a non-default target score", () => {
    expect(houseRulesOf({ ...match, target_score: 15 }).targetScore).toBe(15)
  })
})
