import { RallyLengthCurve } from "@/features/dashboard/components/profile/rally-length-curve"

import type { CurveBucket } from "@/features/dashboard/lib/profile-types"
import type { Meta, StoryObj } from "@storybook/react-vite"

// Win rate against rally length — the archetype curve on the profile's Stats
// tab. Reach for it to answer "what kind of player is this?": a line that
// climbs past nine shots is a grinder, one that sags is a shotmaker. The
// dashed 50% line is break-even, and each x label carries its own sample.

const GRINDER: Array<CurveBucket> = [
  { label: "1–3 · 80", rallies: 80, winRate: 44 },
  { label: "4–8 · 80", rallies: 80, winRate: 50 },
  { label: "9+ · 40", rallies: 40, winRate: 63 },
]

const SHOTMAKER: Array<CurveBucket> = [
  { label: "1–3 · 96", rallies: 96, winRate: 61 },
  { label: "4–8 · 54", rallies: 54, winRate: 48 },
  { label: "9+ · 18", rallies: 18, winRate: 33 },
]

const meta = {
  title: "Dashboard/Rally length curve",
  component: RallyLengthCurve,
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  args: { buckets: GRINDER },
} satisfies Meta<typeof RallyLengthCurve>

export default meta
type Story = StoryObj<typeof meta>

// Sam's shape: below break-even in the short exchanges, above it once the
// rally passes nine shots.
export const Grinder: Story = {}

// Alex's opposite lean, and the reason the chart exists — the same three
// buckets tell two entirely different stories.
export const Shotmaker: Story = {
  args: { buckets: SHOTMAKER },
}

// A bucket with no rallies has no win rate to plot, so it gets no point and
// no label — but it keeps its slot on the axis, so the length scale stays
// honest instead of quietly closing the gap.
export const EmptyBucket: Story = {
  name: "One empty bucket",
  args: {
    buckets: [
      { label: "1–3 · 61", rallies: 61, winRate: 52 },
      { label: "4–8 · 34", rallies: 34, winRate: 47 },
      { label: "9+ · 0", rallies: 0, winRate: null },
    ],
  },
}

// Nothing to rate anywhere: the curve refuses to draw rather than plot a
// line through three empty buckets.
export const NotEnoughData: Story = {
  name: "Not enough data",
  args: {
    buckets: [
      { label: "1–3 · 0", rallies: 0, winRate: null },
      { label: "4–8 · 0", rallies: 0, winRate: null },
      { label: "9+ · 0", rallies: 0, winRate: null },
    ],
  },
}
