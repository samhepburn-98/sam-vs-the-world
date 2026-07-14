// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"

import {
  AttributeRadar,
  radarLabel,
  toRadarData,
} from "@/features/dashboard/components/attribute-radar"
import { computePlayerAttributes } from "@/features/dashboard/lib/player-attributes"
import { player } from "@/features/dashboard/lib/player-data.fixtures"

import type { PlayerAttribute } from "@/features/dashboard/lib/player-attributes"

// jsdom has no ResizeObserver; recharts' responsive chart wants one.
beforeAll(() => {
  if (!("ResizeObserver" in globalThis)) {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )
  }
})

const attr = (over: Partial<PlayerAttribute>): PlayerAttribute => ({
  key: "srv",
  code: "SRV",
  detail: "",
  value: 50,
  display: "50",
  sr: "",
  ...over,
})

describe("toRadarData", () => {
  it("keeps the codes in attribute order", () => {
    const data = toRadarData(computePlayerAttributes(player()))
    expect(data.map((d) => d.code)).toEqual([
      "SRV",
      "RET",
      "ATT",
      "CON",
      "GRD",
      "CLU",
    ])
  })

  it("collapses an unmeasured attribute to the centre, not a value", () => {
    const data = toRadarData([
      attr({ code: "SRV", value: 62 }),
      attr({ code: "RET", value: null, display: "—" }),
    ])
    expect(data).toEqual([
      { code: "SRV", value: 62 },
      { code: "RET", value: 0 },
    ])
  })
})

describe("radarLabel", () => {
  it("reads each code with its display value, dashes included", () => {
    const label = radarLabel("Alex", [
      attr({ code: "SRV", value: 62, display: "62" }),
      attr({ code: "RET", value: null, display: "—" }),
    ])
    expect(label).toBe("Alex's attribute radar: SRV 62, RET —")
  })
})

describe("AttributeRadar", () => {
  it("renders as an image named for the player and their six numbers", () => {
    render(
      <AttributeRadar
        attrs={computePlayerAttributes(player())}
        side="p1"
        name="Alex"
      />
    )
    const img = screen.getByRole("img")
    expect(img.getAttribute("aria-label")).toContain("Alex's attribute radar")
    expect(img.getAttribute("aria-label")).toContain("SRV 58")
  })

  it("renders for either duel side", () => {
    render(
      <AttributeRadar
        attrs={computePlayerAttributes(player())}
        side="p2"
        name="Ormond"
      />
    )
    expect(
      screen.getByRole("img", { name: /Ormond's attribute radar/ })
    ).toBeDefined()
  })
})
