// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { RallyTimeline } from "./rally-timeline"

import type { RallyRow } from "@/lib/rally/rally-draft"

// RTL auto-cleanup needs vitest globals, which we don't enable — clean manually.
afterEach(cleanup)

const SAM = "11111111-1111-4111-8111-111111111111"
const DAVE = "22222222-2222-4222-8222-222222222222"

function row(
  overrides: Partial<RallyRow> & { rally_number: number }
): RallyRow {
  return {
    id: `id-${overrides.rally_number}`,
    game_id: "g1",
    server_id: SAM,
    serve_side: "left",
    serve_number: 1,
    winner_id: SAM,
    end_reason: "winner",
    error_detail: null,
    forced: null,
    winning_shot: null,
    losing_shot: null,
    shot_count: null,
    ...overrides,
  }
}

// sam wins #1, let at #2 (score must hold), dave wins #3 on a tin
const rows = [
  row({ rally_number: 1, winner_id: SAM, end_reason: "winner" }),
  row({ rally_number: 2, winner_id: null, end_reason: "let" }),
  row({
    rally_number: 3,
    winner_id: DAVE,
    end_reason: "error",
    error_detail: "tin",
    forced: false,
  }),
]

function renderTimeline(extra?: Partial<Parameters<typeof RallyTimeline>[0]>) {
  return render(
    <RallyTimeline
      rows={rows}
      p1Id={SAM}
      p1Name="Sam"
      p2Name="Dave"
      servesPerPoint={2}
      {...extra}
    />
  )
}

describe("RallyTimeline", () => {
  it("newest at top, running score derived per row, lets advance nothing", () => {
    renderTimeline()
    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(3)

    // newest first: dave's tin at 1–1, then the let, then sam's winner at 1–0
    expect(within(items[0]).getByText("1–1")).toBeDefined()
    expect(within(items[1]).getByText(/let \(replayed\)/)).toBeDefined()
    expect(within(items[2]).getByText("1–0")).toBeDefined()
  })

  it("full outcome + serve context on each decided rally", () => {
    renderTimeline()
    expect(screen.getByText("error · tin · unforced")).toBeDefined()
    expect(
      screen.getByText(/#3 · Sam served · left box · 1st serve/)
    ).toBeDefined()
  })

  it("read-only by default; editable rows are buttons that surface the row", () => {
    const onRowClick = vi.fn()
    renderTimeline()
    expect(screen.queryByRole("button")).toBeNull()
    cleanup()

    renderTimeline({ editable: true, onRowClick })
    fireEvent.click(screen.getAllByRole("button")[0])
    expect(onRowClick).toHaveBeenCalledWith(
      expect.objectContaining({ rally_number: 3 })
    )
  })

  it("swaps the edited row for the provided editor", () => {
    renderTimeline({
      editable: true,
      editingId: "id-3",
      renderEditor: (r) => <p>editing rally {r.rally_number}</p>,
    })
    expect(screen.getByText("editing rally 3")).toBeDefined()
    expect(screen.queryByText("error · tin · unforced")).toBeNull()
  })

  it("single-serve match hides the serve-number chip", () => {
    renderTimeline({ servesPerPoint: 1 })
    expect(screen.queryByText(/1st serve/)).toBeNull()
  })
})
