import { describe, expect, it } from "vitest"

import {
  oppositeSide,
  suggestNext,
  suggestNextGameFirstServer,
} from "./suggest"
import { DEFAULT_HOUSE_RULES } from "./types"

import type { GameContext, RallyInput } from "./types"

const ctx: GameContext = {
  player1Id: "sam",
  player2Id: "dave",
  firstServerId: "sam",
  rules: DEFAULT_HOUSE_RULES,
}

function rally(over: Partial<RallyInput>): RallyInput {
  return {
    serverId: "sam",
    serveSide: "left",
    serveNumber: 1,
    winnerId: "sam",
    endReason: "winner",
    ...over,
  }
}

describe("suggestNext", () => {
  it("first rally: the chosen first server, serve 1", () => {
    expect(suggestNext([], ctx)).toEqual({
      serverId: "sam",
      serveSide: "left",
      serveNumber: 1,
    })
  })

  it("retained server alternates boxes", () => {
    const next = suggestNext([rally({ serveSide: "left" })], ctx)
    expect(next.serverId).toBe("sam")
    expect(next.serveSide).toBe("right")
  })

  it("serve changes hands when the receiver wins", () => {
    const next = suggestNext(
      [rally({ winnerId: "dave", endReason: "stroke" })],
      ctx
    )
    expect(next.serverId).toBe("dave")
    expect(next.serveNumber).toBe(1)
  })

  it("let: same server, same box, serve number KEPT (Sam's rule)", () => {
    const next = suggestNext(
      [rally({ serveNumber: 2, winnerId: null, endReason: "let" })],
      ctx
    )
    expect(next).toEqual({
      serverId: "sam",
      serveSide: "left",
      serveNumber: 2,
    })
  })

  it("let with letResetsServe: serve number resets to 1", () => {
    const resetCtx = {
      ...ctx,
      rules: { ...DEFAULT_HOUSE_RULES, letResetsServe: true },
    }
    const next = suggestNext(
      [rally({ serveNumber: 2, winnerId: null, endReason: "let" })],
      resetCtx
    )
    expect(next.serveNumber).toBe(1)
  })

  it("after a decided rally the serve number resets to 1 (fault state is per-point)", () => {
    const next = suggestNext(
      [rally({ serveNumber: 2, winnerId: "dave", endReason: "serve_fault" })],
      ctx
    )
    expect(next.serveNumber).toBe(1)
  })

  it("a run of retained serves keeps alternating deterministically", () => {
    const rallies = [
      rally({ serveSide: "left" }),
      rally({ serveSide: "right" }),
    ]
    expect(suggestNext(rallies, ctx).serveSide).toBe("left")
  })
})

describe("suggestNextGameFirstServer", () => {
  it("previous game's winner serves first", () => {
    expect(suggestNextGameFirstServer("dave", ctx)).toBe("dave")
  })

  it("falls back to the match's first server when no previous winner", () => {
    expect(suggestNextGameFirstServer(null, ctx)).toBe("sam")
  })
})

describe("oppositeSide", () => {
  it("flips", () => {
    expect(oppositeSide("left")).toBe("right")
    expect(oppositeSide("right")).toBe("left")
  })
})
