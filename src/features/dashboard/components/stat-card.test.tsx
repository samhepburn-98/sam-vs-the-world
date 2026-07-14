// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { StatCard } from "./stat-card"

afterEach(cleanup)

describe("StatCard", () => {
  it("always shows a rate beside its denominator", () => {
    render(
      <StatCard label="Win rate" rate={{ won: 15, of: 22 }} minSample={5} />
    )
    expect(screen.getByText("68%")).toBeDefined()
    expect(screen.getByText("· 15 of 22")).toBeDefined()
  })

  it("hides the number below the sample threshold, showing n instead", () => {
    render(<StatCard label="Win rate" rate={{ won: 2, of: 3 }} minSample={5} />)
    // no percentage is rendered at all
    expect(screen.queryByText(/%$/)).toBeNull()
    expect(screen.getByText("(n=3)")).toBeDefined()
    expect(screen.getByText(/Not enough data yet/)).toBeDefined()
  })

  it("renders a plain count with its unit, no percent sign", () => {
    render(
      <StatCard
        label="Errors"
        value={3.4}
        unit="per game"
        sample={9}
        minSample={5}
      />
    )
    expect(screen.getByText("3.4")).toBeDefined()
    expect(screen.getByText("per game")).toBeDefined()
    expect(screen.queryByText(/%/)).toBeNull()
  })

  it("gates a plain value on its own sample", () => {
    render(
      <StatCard
        label="Errors"
        value={3.4}
        unit="per game"
        sample={2}
        minSample={5}
      />
    )
    expect(screen.getByText("(n=2)")).toBeDefined()
    expect(screen.queryByText("3.4")).toBeNull()
  })
})
