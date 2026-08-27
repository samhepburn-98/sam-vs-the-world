import { describe, expect, it } from "vitest"

import { ALEX_ATTRS, SAM_ATTRS, THIN_ATTRS } from "#storybook/fixtures"

// The story fixtures make two claims that are easy to get wrong and invisible
// when they are: that Sam and Alex are genuinely different players, and that
// the thin player is under-sampled everywhere. Both were wrong on the first
// attempt — Alex tied Sam on five of six attributes, and THIN tripped no gate
// at all while its comment said it tripped every one. So they are pinned here
// rather than asserted in a comment.

describe("story fixtures", () => {
  it("gives Sam and Alex a different value on every attribute", () => {
    const tied = SAM_ATTRS.filter(
      (a, i) => a.value === ALEX_ATTRS[i].value
    ).map((a) => a.key)
    // a duel built from these should have six live rows, not five dead-level
    expect(tied).toEqual([])
  })

  it("has both of them fully measured, so no row reads as a gap", () => {
    for (const attr of [...SAM_ATTRS, ...ALEX_ATTRS]) {
      expect(attr.value).not.toBeNull()
    }
  })

  it("puts the thin player under every honesty gate", () => {
    // each attribute has its own denominator and its own threshold; a fixture
    // that only thins the wins leaves all six printing
    for (const attr of THIN_ATTRS) {
      expect(attr.value, `${attr.key} should be gated`).toBeNull()
      expect(attr.display).toBe("—")
    }
  })
})
