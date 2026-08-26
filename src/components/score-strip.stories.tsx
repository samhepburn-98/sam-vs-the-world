import { ScoreStrip } from "@/components/score-strip"

import type { Meta, StoryObj } from "@storybook/react-vite"

const meta = {
  title: "UI/Score strip",
  component: ScoreStrip,
  args: { name1: "Sam", name2: "Alex", score1: 0, score2: 6, outcome: "p2" },
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
  args: { score1: 3, score2: 3, outcome: null },
  render: (args) => (
    <div className="w-80">
      <ScoreStrip {...args} />
    </div>
  ),
}
