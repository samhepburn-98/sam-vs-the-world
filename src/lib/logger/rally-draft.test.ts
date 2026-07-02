import { describe, expect, it } from "vitest"

import { DEFAULT_HOUSE_RULES } from "@/lib/scoring"
import {
  buildLetRow,
  buildRallyRow,
  canSave,
  createDraft,
  selectEndReason,
  showsErrorDetail,
  showsForced,
  showsShotType,
  tapWinner,
  toggleServeNumber,
  toggleServeSide,
  toggleServer,
} from "./rally-draft"

import type { DraftContext } from "./rally-draft"

const ctx: DraftContext = {
  player1Id: "sam",
  player2Id: "dave",
  rules: DEFAULT_HOUSE_RULES,
}
const singleServeCtx: DraftContext = {
  ...ctx,
  rules: { ...DEFAULT_HOUSE_RULES, servesPerPoint: 1 },
}

const suggestion = {
  serverId: "sam",
  serveSide: "left",
  serveNumber: 1,
} as const

function draftWithWinner(winnerId: string) {
  return tapWinner(createDraft(suggestion), winnerId)
}

describe("auto-rules (mirror the DB constraints — §8.7 #4)", () => {
  it("ace corrects the SERVER to the winner, never the winner", () => {
    // Dave tapped as winner while the suggestion says Sam serves: if it was
    // an ace, Dave must have served — the suggestion gets corrected.
    const draft = selectEndReason(draftWithWinner("dave"), "ace", ctx)
    expect(draft.winnerId).toBe("dave")
    expect(draft.serverId).toBe("dave")
  })

  it("serve fault corrects the server to the NON-winner and forces serve 2", () => {
    const draft = selectEndReason(draftWithWinner("sam"), "serve_fault", ctx)
    expect(draft.winnerId).toBe("sam")
    expect(draft.serverId).toBe("dave")
    expect(draft.serveNumber).toBe(2)
  })

  it("single-serve match: fault does NOT force serve 2 (fault on 1 is the point)", () => {
    const draft = selectEndReason(
      draftWithWinner("sam"),
      "serve_fault",
      singleServeCtx,
    )
    expect(draft.serveNumber).toBe(1)
  })

  it("switching away from error clears error-only fields", () => {
    let draft = selectEndReason(draftWithWinner("sam"), "error", ctx)
    draft = { ...draft, errorDetail: "tin", forced: true }
    draft = selectEndReason(draft, "winner", ctx)
    expect(draft.errorDetail).toBeNull()
    expect(draft.forced).toBeNull()
  })

  it("switching away from winner clears shot type", () => {
    let draft = selectEndReason(draftWithWinner("sam"), "winner", ctx)
    draft = { ...draft, shotType: "drop" }
    draft = selectEndReason(draft, "stroke", ctx)
    expect(draft.shotType).toBeNull()
  })
})

describe("field visibility per end reason", () => {
  it.each([
    ["winner", false, false, true],
    ["error", true, true, false],
    ["stroke", false, false, false],
    ["ace", false, false, true],
    ["serve_fault", true, false, false],
  ] as const)("%s → detail %s, forced %s, shotType %s", (reason, d, f, s) => {
    expect(showsErrorDetail(reason)).toBe(d)
    expect(showsForced(reason)).toBe(f)
    expect(showsShotType(reason)).toBe(s)
  })
})

describe("serve context toggles", () => {
  it("q toggles serve number in a two-serve match", () => {
    const draft = createDraft(suggestion)
    expect(toggleServeNumber(draft, ctx).serveNumber).toBe(2)
    expect(toggleServeNumber(toggleServeNumber(draft, ctx), ctx).serveNumber).toBe(1)
  })

  it("serve-number toggle is inert in a single-serve match", () => {
    const draft = createDraft(suggestion)
    expect(toggleServeNumber(draft, singleServeCtx).serveNumber).toBe(1)
  })

  it("z toggles the box; server toggle flips to the other player", () => {
    const draft = createDraft(suggestion)
    expect(toggleServeSide(draft).serveSide).toBe("right")
    expect(toggleServer(draft, ctx).serverId).toBe("dave")
  })
})

describe("saving", () => {
  it("cannot save without winner + end reason", () => {
    expect(canSave(createDraft(suggestion))).toBe(false)
    expect(canSave(draftWithWinner("sam"))).toBe(false)
    expect(canSave(selectEndReason(draftWithWinner("sam"), "winner", ctx))).toBe(
      true,
    )
    expect(() =>
      buildRallyRow(createDraft(suggestion), {
        id: "x",
        gameId: "g",
        rallyNumber: 1,
      }),
    ).toThrow(/incomplete/)
  })

  it("builds the full rally row with nullables intact", () => {
    let draft = selectEndReason(draftWithWinner("dave"), "error", ctx)
    draft = { ...draft, errorDetail: "tin", forced: false, shotCount: 12 }
    const row = buildRallyRow(draft, { id: "r1", gameId: "g1", rallyNumber: 7 })
    expect(row).toEqual({
      id: "r1",
      game_id: "g1",
      rally_number: 7,
      server_id: "sam",
      serve_side: "left",
      serve_number: 1,
      winner_id: "dave",
      end_reason: "error",
      error_detail: "tin",
      forced: false,
      shot_type: null,
      shot_count: 12,
    })
  })

  it("the let path saves immediately with the current serve context (§5.3)", () => {
    let draft = createDraft(suggestion)
    draft = toggleServeNumber(draft, ctx) // point being replayed on serve 2
    const row = buildLetRow(draft, { id: "l1", gameId: "g1", rallyNumber: 3 })
    expect(row).toMatchObject({
      winner_id: null,
      end_reason: "let",
      serve_number: 2,
      error_detail: null,
      forced: null,
      shot_type: null,
      shot_count: null,
    })
  })
})
