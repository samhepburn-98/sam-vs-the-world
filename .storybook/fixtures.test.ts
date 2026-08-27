import { describe, expect, it } from "vitest"

import {
  ALEX_ATTRS,
  SAM_ATTRS,
  THIN_ATTRS,
  THIN_DATA,
} from "#storybook/fixtures"

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

  it("keeps the thin player thin everywhere, not just on the attributes", () => {
    // the builders default to a seasoned player, so a partial override renders
    // six dashes next to a 7-5 match record and the trait "Grinder"
    const { headline, error, momentum } = THIN_DATA
    expect(headline?.matches_decided).toBeLessThan(3)
    expect(headline?.signature_trait).toBeNull()
    expect(momentum?.comebacks).toBe(0)
    // and the error counts have to add up the way a real row would
    const e = error
    expect(e).toBeDefined()
    if (!e) return
    expect(e.forced_errors + e.unforced_errors + e.untagged_errors).toBe(
      e.errors_total
    )
    expect(e.tin + e.out_top + e.out_side + e.out_back + e.not_up).toBe(
      e.errors_total
    )
  })
})
