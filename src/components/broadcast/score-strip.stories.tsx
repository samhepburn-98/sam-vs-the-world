import { ScoreStrip } from "@/components/broadcast/score-strip"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The full-time graphic: both names in the display face with the score between
// them on a deep panel, the winner's side carrying their colour. Match detail
// is its one home — the strip under the "Full time" overline at the head of
// the page. For a match inside a list, reach for MatchRow instead.

const meta = {
  title: "Broadcast/Score strip",
  component: ScoreStrip,
  args: {
    p1Name: "Sam",
    p2Name: "Alex",
    p1Score: 0,
    p2Score: 6,
    outcome: "p2",
  },
} satisfies Meta<typeof ScoreStrip>

export default meta
type Story = StoryObj<typeof meta>

export const FullTime: Story = {
  name: "Full time",
  render: (args) => (
    <div className="w-80">
      <ScoreStrip {...args} />
    </div>
  ),
}

export const Drawn: Story = {
  args: { p1Score: 3, p2Score: 3, outcome: null },
  render: (args) => (
    <div className="w-80">
      <ScoreStrip {...args} />
    </div>
  ),
}
