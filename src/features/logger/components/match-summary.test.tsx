// @vitest-environment jsdom
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { MatchSummary } from "./match-summary"

// RTL auto-cleanup needs vitest globals, which we don't enable — clean manually.
afterEach(cleanup)

// MatchSummary renders a router Link, so it needs a minimal live router.
function renderWithRouter(ui: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => ui })
  const matchRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/matches/$matchId",
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([matchRoute]),
  })
  return render(<RouterProvider router={router} />)
}

describe("MatchSummary", () => {
  it("shows derived game scores, winner headline, and the match-page link", async () => {
    renderWithRouter(
      <MatchSummary
        matchId="m1"
        headline="Sam wins 2–1"
        subline="Sam vs Dave · 2026-07-03 · best of 3 · to 11 · two serves"
        games={[
          { gameNumber: 1, scoreline: "11–9", winnerName: "Sam" },
          { gameNumber: 2, scoreline: "7–11", winnerName: "Dave" },
          { gameNumber: 3, scoreline: "11–5", winnerName: "Sam" },
        ]}
        onDone={() => undefined}
      />
    )

    await waitFor(() => {
      expect(screen.getByText("Sam wins 2–1")).toBeDefined()
    })
    expect(screen.getByText("11–9")).toBeDefined()
    expect(screen.getByText("7–11")).toBeDefined()
    expect(
      screen.getByRole("link", { name: "View match page" }).getAttribute("href")
    ).toBe("/matches/m1")
  })
})
