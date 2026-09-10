import { RallyLengthHisto } from "@/features/dashboard/components/category/rally-length-histo"
import { rally } from "@/features/dashboard/lib/player-data.fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"

// Where the rallies actually live — the three length buckets as count bars,
// each capped with the win rate inside it. Reach for it on the rally category
// page when the question is volume first, quality second: the bar heights say
// how the game is played, the labels say whether it is working.

const meta = {
  title: "Dashboard/Rally length histogram",
  component: RallyLengthHisto,
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  args: { lengths: rally() },
} satisfies Meta<typeof RallyLengthHisto>

export default meta
type Story = StoryObj<typeof meta>

// Sam: the counts are even across the first two buckets, but the win rate
// climbs with every extra shot.
export const Grinder: Story = {}

// Alex plays the other game — most rallies over inside three shots, and the
// win rate falling away as they stretch.
export const Shotmaker: Story = {
  args: {
    lengths: rally({
      total_rallies: 168,
      avg_length: 4.2,
      longest: 19,
      short_rallies: 96,
      short_wins: 59,
      medium_rallies: 54,
      medium_wins: 26,
      long_rallies: 18,
      long_wins: 6,
    }),
  },
}

// Ormond has never been taken past eight shots. The 9+ bar has no height and
// no win rate above it — a bucket with no rallies is not a 0% bucket.
export const EmptyBucket: Story = {
  name: "An empty bucket",
  args: {
    lengths: rally({
      total_rallies: 47,
      avg_length: 3.6,
      longest: 8,
      short_rallies: 31,
      short_wins: 14,
      medium_rallies: 16,
      medium_wins: 7,
      long_rallies: 0,
      long_wins: 0,
    }),
  },
}
