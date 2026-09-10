// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { RallyTable } from "./rally-table"

import type { RallyScored } from "@/lib/schemas/rally"

afterEach(cleanup)

const P1 = "11111111-1111-4111-8111-111111111111"
const P2 = "22222222-2222-4222-8222-222222222222"

const rally = (n: number): RallyScored => ({
  id: `33333333-3333-4333-8333-${String(n).padStart(12, "0")}`,
  game_id: "44444444-4444-4444-8444-444444444444",
  match_id: "55555555-5555-4555-8555-555555555555",
  game_number: 1,
  date: "2026-07-14",
  ball_type: "double_yellow",
  player1_id: P1,
  player2_id: P2,
  server_id: P1,
  receiver_id: P2,
  rally_number: n,
  serve_side: "right",
  serve_number: 1,
  winner_id: P1,
  end_reason: "winner",
  error_detail: null,
  forced: null,
  winning_shot: "drive",
  losing_shot: null,
  shot_count: 6,
  is_let: false,
  score_p1: n,
  score_p2: 0,
})

const many = (n: number) => Array.from({ length: n }, (_, i) => rally(i + 1))

// §3.5: a truncated list must say so. The RPC hands back the most recent n,
// and a table that quietly showed them as if they were everything would be
// the same lie as a rate without its denominator.
describe("RallyTable truncation notice", () => {
  it("says so when the list came back full", () => {
    render(<RallyTable rallies={many(50)} playerId={P1} limit={50} />)
    expect(screen.getByText(/50 most recent rallies/)).toBeDefined()
    expect(screen.getByText(/numbers above count every one/)).toBeDefined()
  })

  it("stays quiet when the list is short of the limit", () => {
    render(<RallyTable rallies={many(12)} playerId={P1} limit={50} />)
    expect(screen.queryByText(/most recent rallies/)).toBeNull()
  })

  it("stays quiet when no limit was asked for", () => {
    render(<RallyTable rallies={many(80)} playerId={P1} />)
    expect(screen.queryByText(/most recent rallies/)).toBeNull()
  })
})
