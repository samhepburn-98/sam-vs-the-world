import { describe, expect, it } from "vitest"

import { fitWithin } from "./downscale"

// The canvas glue in downscaleImage is browser-only (jsdom has no 2D
// context), so the sizing maths carries the logic and gets the coverage.

describe("fitWithin", () => {
  it("shrinks a landscape image by its width", () => {
    expect(fitWithin(1600, 1200, 800)).toEqual({ width: 800, height: 600 })
  })

  it("shrinks a portrait image by its height", () => {
    expect(fitWithin(1200, 1600, 800)).toEqual({ width: 600, height: 800 })
  })

  it("never upscales a small image", () => {
    expect(fitWithin(400, 300, 800)).toEqual({ width: 400, height: 300 })
  })

  it("passes an exact fit through untouched", () => {
    expect(fitWithin(800, 800, 800)).toEqual({ width: 800, height: 800 })
  })

  it("rounds to whole pixels", () => {
    // 1000×333 → scale 0.8 → 800×266.4 → 266
    expect(fitWithin(1000, 333, 800)).toEqual({ width: 800, height: 266 })
  })

  it("never collapses an extreme aspect ratio to zero", () => {
    expect(fitWithin(10000, 3, 800)).toEqual({ width: 800, height: 1 })
  })
})
