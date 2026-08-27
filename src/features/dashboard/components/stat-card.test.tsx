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

  // Compile-time half of the honesty rules: these are assertions `pnpm
  // typecheck` runs, and an unused @ts-expect-error is itself an error — so
  // if the props union ever loosens back into "everything optional", the
  // build goes red here rather than a percentage quietly growing a unit.
  it("makes the dishonest prop combinations unrepresentable", () => {
    const rejected = [
      // a rate with a unit would render "68% shots"
      // @ts-expect-error unit belongs to value mode, not rate mode
      <StatCard
        key="a"
        label="Win rate"
        rate={{ won: 1, of: 2 }}
        unit="shots"
      />,
      // a rate gated on a sample that isn't its own denominator
      // @ts-expect-error sample belongs to value mode; a rate uses its `of`
      <StatCard
        key="b"
        label="Win rate"
        rate={{ won: 1, of: 2 }}
        sample={99}
      />,
      // both modes at once — which number wins?
      // @ts-expect-error a card is a rate or a value, never both
      <StatCard key="c" label="Win rate" rate={{ won: 1, of: 2 }} value={5} />,
      // neither mode — a card with nothing to say
      // @ts-expect-error a card must carry one of rate or value
      <StatCard key="d" label="Win rate" />,
    ]
    expect(rejected).toHaveLength(4)
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
