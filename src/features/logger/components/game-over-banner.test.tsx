// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { GameOverBanner } from "./game-over-banner"

// RTL auto-cleanup needs vitest globals, which we don't enable — clean manually.
afterEach(cleanup)

describe("GameOverBanner", () => {
  it("game over mid-match: start-next (winner serves) + finish, logging not gated", () => {
    const onStartNextGame = vi.fn()
    render(
      <GameOverBanner
        gameNumber={2}
        gameWinnerName="Sam"
        scoreline="11–9"
        onStartNextGame={onStartNextGame}
        onFinishMatch={() => undefined}
      />
    )

    expect(screen.getByText(/Game 2 to Sam/)).toBeDefined()
    expect(screen.getByText(/keep logging/)).toBeDefined()
    fireEvent.click(
      screen.getByRole("button", { name: "Start game 3 — Sam serves" })
    )
    expect(onStartNextGame).toHaveBeenCalledOnce()
  })

  it("match clinched: finish only, no next game", () => {
    const onFinishMatch = vi.fn()
    render(
      <GameOverBanner
        gameNumber={3}
        gameWinnerName="Sam"
        scoreline="12–10"
        matchWinnerName="Sam"
        onStartNextGame={() => undefined}
        onFinishMatch={onFinishMatch}
      />
    )

    expect(screen.getByText("Sam takes the match")).toBeDefined()
    expect(screen.queryByRole("button", { name: /Start game/ })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Finish match" }))
    expect(onFinishMatch).toHaveBeenCalledOnce()
  })
})
