import { describe, expect, it } from "vitest"

import { planCreateMatch } from "./create-match"

import type { MatchSetupInput } from "@/lib/schemas/match"

const input: MatchSetupInput = {
  player1Id: "11111111-1111-4111-8111-111111111111",
  player2Id: "22222222-2222-4222-8222-222222222222",
  date: "2026-07-02",
  venue: "Local courts",
  firstServerId: "11111111-1111-4111-8111-111111111111",
  houseRules: {
    format: 3,
    targetScore: 11,
    tiebreak: "win_by_2",
    servesPerPoint: 2,
    letResetsServe: false,
    ballType: "double_yellow",
  },
}

function fakeClient() {
  const inserts: Array<[string, Record<string, unknown>]> = []
  return {
    inserts,
    from(table: "matches" | "games") {
      return {
        insert(values: Record<string, unknown>) {
          inserts.push([table, values])
          return Promise.resolve({ error: null })
        },
      }
    },
  }
}

describe("planCreateMatch", () => {
  it("maps the setup input onto the match row, house rules included", async () => {
    const client = fakeClient()
    const plan = planCreateMatch(input, client)
    for (const op of plan.ops) await op.run()

    const [table, row] = client.inserts[0]
    expect(table).toBe("matches")
    expect(row).toMatchObject({
      id: plan.matchId,
      date: "2026-07-02",
      player1_id: input.player1Id,
      player2_id: input.player2Id,
      venue: "Local courts",
      format: 3,
      target_score: 11,
      tiebreak: "win_by_2",
      serves_per_point: 2,
      let_resets_serve: false,
      ball_type: "double_yellow",
    })
  })

  it("orders the match row before game 1, FK-safe under FIFO", async () => {
    const client = fakeClient()
    const plan = planCreateMatch(input, client)
    for (const op of plan.ops) await op.run()

    expect(client.inserts.map(([t]) => t)).toEqual(["matches", "games"])
    expect(client.inserts[1][1]).toEqual({
      id: plan.gameId,
      match_id: plan.matchId,
      game_number: 1,
    })
  })

  it("normalises an empty venue to null and casual format to null", async () => {
    const client = fakeClient()
    const casual: MatchSetupInput = {
      ...input,
      venue: "",
      houseRules: { ...input.houseRules, format: null, ballType: null },
    }
    for (const op of planCreateMatch(casual, client).ops) await op.run()

    expect(client.inserts[0][1]).toMatchObject({
      venue: null,
      format: null,
      ball_type: null,
    })
  })

  it("generates distinct client uuids for idempotent retries", () => {
    const plan = planCreateMatch(input, fakeClient())
    expect(plan.matchId).not.toBe(plan.gameId)
    expect(plan.ops.map((op) => op.id)).toEqual([plan.matchId, plan.gameId])
  })
})
