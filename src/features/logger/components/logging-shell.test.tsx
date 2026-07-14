// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { WriteQueue } from "@/lib/api/write-queue"

import { LoggingShell } from "./logging-shell"

import type { MatchDetail } from "@/lib/schemas/match"

// RTL auto-cleanup needs vitest globals, which we don't enable — clean manually.
afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

const SAM = "11111111-1111-4111-8111-111111111111"
const DAVE = "22222222-2222-4222-8222-222222222222"

const match = {
  id: "33333333-3333-4333-8333-333333333333",
  date: "2026-07-03",
  player1_id: SAM,
  player2_id: DAVE,
  venue: null,
  format: 3,
  target_score: 11,
  tiebreak: "win_by_2",
  serves_per_point: 2,
  let_resets_serve: false,
  ball_type: null,
  notes: null,
  games: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      game_number: 1,
      rallies: [],
    },
  ],
} as unknown as MatchDetail

vi.mock("@/lib/api/get-match-detail", () => ({
  useMatchDetail: () => ({
    isPending: false,
    isError: false,
    data: match,
    refetch: () => undefined,
  }),
}))

// ops must not touch the real Supabase client — the queue runs them for real
vi.mock("@/lib/api/session-ops", () => ({
  intentToOp: (intent: { kind: string }) => ({
    id: Math.random().toString(),
    label: intent.kind,
    run: () => Promise.resolve(),
  }),
}))

const players = [
  { id: SAM, name: "Sam", handedness: null, avatar_url: null },
  { id: DAVE, name: "Dave", handedness: null, avatar_url: null },
]

function renderShell() {
  const queue = new WriteQueue({ classify: () => "permanent" })
  return render(
    <LoggingShell
      matchId={match.id}
      players={players}
      queue={queue}
      firstServerId={SAM}
      onExit={() => undefined}
    />
  )
}

const press = (key: string, mods: Record<string, boolean> = {}) => {
  fireEvent.keyDown(window, { key, ...mods })
}

describe("keyboard-first logging (§5.3)", () => {
  it("a full game is enterable keyboard-only: s·w·enter ×11 → game-over banner", () => {
    renderShell()
    for (let i = 0; i < 11; i++) {
      press("s") // left player (Sam) won
      press("w") // winner
      press("Enter") // save
    }
    expect(screen.getByText(/Game 1 to Sam/)).toBeDefined()
    expect(screen.getByText("11–0")).toBeDefined()
  })

  it("the full chip flow works by key: winner, error+tin+forced, digits, undo", () => {
    renderShell()
    press("d") // right player (Dave) won…
    press("e") // …because Sam erred…
    press("t") // …into the tin…
    press("g") // …forced
    press("1")
    press("2") // 12 shots (replace then append)
    press("Enter")

    expect(screen.getByText("error · tin · forced · 12 shots")).toBeDefined()

    press("u") // undo pops it
    expect(screen.queryByText(/error · tin/)).toBeNull()
  })

  it("serve fault is hidden (and f inert) when the winner is the shown server", () => {
    renderShell()
    press("s") // Sam won — and Sam is the suggested server
    expect(
      screen.queryByRole("radio", { name: /faulted the serve/i })
    ).toBeNull()
    press("f") // inert — nothing selected, save stays disabled
    expect(screen.getByRole("button", { name: /save/i })).toHaveProperty(
      "disabled",
      true
    )

    press("d") // switch to Dave — now a fault by server Sam fits
    expect(
      screen.getByRole("radio", { name: /faulted the serve/i })
    ).toBeDefined()
  })

  it("the detail zone collapses via its toggle and the preference sticks", () => {
    renderShell()
    press("d")
    press("e") // error → the Where row exists in the detail zone
    expect(screen.getByText("Where")).toBeDefined()

    fireEvent.click(screen.getByRole("button", { name: /hide detail/i }))
    expect(screen.queryByText("Where")).toBeNull()
    expect(window.localStorage.getItem("svw:log-detail")).toBe("0")

    // the preference survives a remount (next rally, next session)
    cleanup()
    renderShell()
    press("d")
    press("e")
    expect(screen.queryByText("Where")).toBeNull()
    expect(screen.getByRole("button", { name: /show detail/i })).toBeDefined()
  })

  it("cmd+z undoes; l saves a let immediately", () => {
    renderShell()
    press("l")
    expect(screen.getByText(/let \(replayed\)/)).toBeDefined()
    press("z", { metaKey: true })
    expect(screen.queryByText(/let \(replayed\)/)).toBeNull()
  })

  it("keys are inert while a text input is focused", () => {
    renderShell()
    press("s") // open the chips — the shots input appears
    const input = screen.getByRole("spinbutton")
    input.focus()
    fireEvent.keyDown(input, { key: "l" }) // would save a let if live
    expect(screen.queryByText(/let \(replayed\)/)).toBeNull()
  })

  it("the sheet's toggle hides control hints (sheet keeps its own) and persists", () => {
    renderShell()
    expect(document.querySelectorAll("kbd").length).toBeGreaterThan(0)

    press("?")
    fireEvent.click(screen.getByRole("button", { name: "Key hints shown" }))
    // the open sheet still shows its keys — they're content, not hints
    expect(
      screen.getByRole("dialog", { name: "Hotkeys" }).querySelectorAll("kbd")
        .length
    ).toBeGreaterThan(0)
    press("Escape")

    expect(document.querySelectorAll("kbd")).toHaveLength(0)
    expect(window.localStorage.getItem("svw:show-key-hints")).toBe("0")

    // the preference survives a remount (fresh session)
    cleanup()
    renderShell()
    expect(document.querySelectorAll("kbd")).toHaveLength(0)
  })

  it("? opens the accurate cheat sheet; Escape closes it", () => {
    renderShell()
    press("?")
    expect(screen.getByRole("dialog", { name: "Hotkeys" })).toBeDefined()
    expect(screen.getByText("Left player won")).toBeDefined()
    expect(screen.getByText("Not up")).toBeDefined()
    // while open, logging keys are swallowed
    press("l")
    expect(screen.queryByText(/let \(replayed\)/)).toBeNull()
    press("Escape")
    expect(screen.queryByRole("dialog")).toBeNull()
  })
})
