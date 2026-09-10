import { describe, expect, it } from "vitest"

import { createMatchWithGame } from "./create-match"

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

const MATCH_ID = "33333333-3333-4333-8333-333333333333"

function fakeClient(result: { data: string | null; error: unknown }) {
  const calls: Array<[string, Record<string, unknown>]> = []
  return {
    calls,
    rpc(fn: "create_match_with_game", args: Record<string, unknown>) {
      calls.push([fn, args])
      return Promise.resolve(result)
    },
  }
}

describe("createMatchWithGame", () => {
  it("maps the setup input onto the RPC args, house rules included", async () => {
    const client = fakeClient({ data: MATCH_ID, error: null })
    await createMatchWithGame(input, client)

    const [fn, args] = client.calls[0]
    expect(fn).toBe("create_match_with_game")
    expect(args).toEqual({
      p_player1_id: input.player1Id,
      p_player2_id: input.player2Id,
      p_date: "2026-07-02",
      p_venue: "Local courts",
      p_format: 3,
      p_target_score: 11,
      p_tiebreak: "win_by_2",
      p_serves_per_point: 2,
      p_let_resets_serve: false,
      p_ball_type: "double_yellow",
    })
  })

  it("returns the new match id", async () => {
    const client = fakeClient({ data: MATCH_ID, error: null })
    await expect(createMatchWithGame(input, client)).resolves.toBe(MATCH_ID)
  })

  // An empty venue, a casual format and an unrecorded ball are all "not set".
  // They are omitted rather than sent as null: each parameter defaults to null
  // in SQL, so PostgREST dropping the key stores exactly the same value, and
  // omitting is what the generated Args type accepts.
  it("omits the unset optional fields rather than sending null", async () => {
    const client = fakeClient({ data: MATCH_ID, error: null })
    const casual: MatchSetupInput = {
      ...input,
      venue: "",
      houseRules: { ...input.houseRules, format: null, ballType: null },
    }
    await createMatchWithGame(casual, client)

    const args = client.calls[0][1]
    expect(args.p_venue).toBeUndefined()
    expect(args.p_format).toBeUndefined()
    expect(args.p_ball_type).toBeUndefined()
    // the set fields still travel
    expect(args.p_target_score).toBe(input.houseRules.targetScore)
  })

  // §1.8 — the match and its game 1 used to be two queued writes, so a failed
  // match left its game queued to FK-fail against a row that never existed,
  // jamming the queue and souring the next submit. One transactional RPC
  // makes the half-state unrepresentable: the whole call either lands or
  // doesn't, and the caller gets a plain rejection to show the user.
  it("throws the error as-is for the caller to translate", async () => {
    const denied = { code: "42501", status: 401, message: "RLS denial" }
    const client = fakeClient({ data: null, error: denied })
    await expect(createMatchWithGame(input, client)).rejects.toBe(denied)
  })

  it("makes exactly one call — nothing to half-succeed", async () => {
    const client = fakeClient({ data: null, error: { status: 503 } })
    await expect(createMatchWithGame(input, client)).rejects.toBeTruthy()
    expect(client.calls).toHaveLength(1)
  })

  it("rejects rather than starting a session on a null id", async () => {
    const client = fakeClient({ data: null, error: null })
    await expect(createMatchWithGame(input, client)).rejects.toThrow(
      /returned no id/
    )
  })
})
