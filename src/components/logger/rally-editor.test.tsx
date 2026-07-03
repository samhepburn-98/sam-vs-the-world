// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { DEFAULT_HOUSE_RULES } from "@/lib/scoring"

import { RallyEditor } from "./rally-editor"

import type { DraftContext, RallyRow } from "@/lib/logger/rally-draft"

// RTL auto-cleanup needs vitest globals, which we don't enable — clean manually.
afterEach(cleanup)

const SAM = "11111111-1111-4111-8111-111111111111"
const DAVE = "22222222-2222-4222-8222-222222222222"

const ctx: DraftContext = {
  player1Id: SAM,
  player2Id: DAVE,
  rules: DEFAULT_HOUSE_RULES,
}

const saved: RallyRow = {
  id: "r1",
  game_id: "g1",
  rally_number: 5,
  server_id: SAM,
  serve_side: "left",
  serve_number: 1,
  winner_id: SAM,
  end_reason: "winner",
  error_detail: null,
  forced: null,
  shot_type: null,
  shot_count: 4,
}

describe("RallyEditor", () => {
  it("edits a field and saves the row with identity/position untouched", () => {
    const onSave = vi.fn()
    render(
      <RallyEditor
        row={saved}
        ctx={ctx}
        p1Name="Sam"
        p2Name="Dave"
        onSave={onSave}
        onCancel={() => undefined}
      />,
    )

    fireEvent.click(screen.getByRole("radio", { name: "Stroke" }))
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "r1",
        game_id: "g1",
        rally_number: 5,
        end_reason: "stroke",
        winner_id: SAM,
        shot_type: null, // auto-rule: shot type doesn't apply to a stroke
      }),
    )
  })

  it("converts a decided rally to a let — winner cleared, still saveable", () => {
    const onSave = vi.fn()
    render(
      <RallyEditor
        row={saved}
        ctx={ctx}
        p1Name="Sam"
        p2Name="Dave"
        onSave={onSave}
        onCancel={() => undefined}
      />,
    )

    fireEvent.click(screen.getByRole("radio", { name: "Let" }))
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        end_reason: "let",
        winner_id: null,
        shot_count: null,
      }),
    )
  })

  it("switching the winner on an ace drags the server along (auto-rule)", () => {
    const onSave = vi.fn()
    render(
      <RallyEditor
        row={{ ...saved, end_reason: "ace" }}
        ctx={ctx}
        p1Name="Sam"
        p2Name="Dave"
        onSave={onSave}
        onCancel={() => undefined}
      />,
    )

    fireEvent.click(screen.getByRole("radio", { name: "Dave" }))
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        winner_id: DAVE,
        server_id: DAVE,
        end_reason: "ace",
      }),
    )
  })
})
