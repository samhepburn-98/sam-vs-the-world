// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "./button"

// Harness proof for component tests (Testing Library + jsdom); the real
// suites (§8.7 #4) build on this setup.
describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Log rally</Button>)
    expect(screen.getByRole("button", { name: "Log rally" })).toBeDefined()
  })
})
