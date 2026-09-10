import { Callout } from "@/components/broadcast/callout"

import type { ProfileInsight } from "@/features/dashboard/lib/profile-types"

// A narrative insight as a broadcast callout: the eyebrow is the kicker, the
// thesis the bold line, the numbers in the body. The Summary tab pairs a
// group of these with each visual so the chart never has to explain itself.
// At most one per group is highlighted — the one worth acting on gets the
// ember bar.

export function NarrativeInsight({ insight }: { insight: ProfileInsight }) {
  return (
    <Callout
      side={insight.highlight ? "p1" : "neutral"}
      label={insight.eyebrow}
      title={insight.title}
    >
      {insight.body}
    </Callout>
  )
}
