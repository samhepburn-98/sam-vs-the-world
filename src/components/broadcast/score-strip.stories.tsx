import { ScoreStrip } from "@/components/broadcast/score-strip"

import type { Meta, StoryObj } from "@storybook/react-vite"

const meta = {
  title: "UI/Score strip",
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
