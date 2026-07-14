import { describe, expect, it } from "vitest"

import { matchSetupSchema } from "./match"

const valid = {
  player1Id: "11111111-1111-4111-8111-111111111111",
  player2Id: "22222222-2222-4222-8222-222222222222",
  date: "2026-07-02",
  firstServerId: "11111111-1111-4111-8111-111111111111",
  houseRules: {
    format: null,
    targetScore: 11,
    tiebreak: "win_by_2",
    servesPerPoint: 2,
    letResetsServe: false,
    ballType: "double_yellow",
  },
}

describe("matchSetupSchema (the form's client-side validation, §8.4)", () => {
  it("accepts a valid casual setup", () => {
    expect(matchSetupSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects the same player twice", () => {
    const result = matchSetupSchema.safeParse({
      ...valid,
      player2Id: valid.player1Id,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe("Pick two different players")
  })

  it("rejects a first server who isn't one of the players", () => {
    const result = matchSetupSchema.safeParse({
      ...valid,
      firstServerId: "33333333-3333-4333-8333-333333333333",
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(["firstServerId"])
  })

  it.each([2, 4, 11])(
    "rejects even/out-of-range best-of format %i",
    (format) => {
      const result = matchSetupSchema.safeParse({
        ...valid,
        houseRules: { ...valid.houseRules, format },
      })
      expect(result.success).toBe(false)
    }
  )

  it("accepts best-of 7 (house rules, §7.7)", () => {
    const result = matchSetupSchema.safeParse({
      ...valid,
      houseRules: { ...valid.houseRules, format: 7 },
    })
    expect(result.success).toBe(true)
  })

  it("accepts single-serve rules", () => {
    const result = matchSetupSchema.safeParse({
      ...valid,
      houseRules: { ...valid.houseRules, servesPerPoint: 1 },
    })
    expect(result.success).toBe(true)
  })
})
