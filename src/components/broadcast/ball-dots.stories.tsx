import { BallDots } from "@/components/broadcast/ball-dots"

import type { BallType } from "@/lib/schemas/enums"
import type { Meta, StoryObj } from "@storybook/react-vite"

// The ball, said the way a squash player says it — one coloured dot, two for
// double yellow. Reach for it wherever a screen has to declare which ball was
// in play, because ball speed is the house rule that changes how every number
// in that match should be read. It carries its own accessible name, so the
// bare dots are enough for a match-history row, the manage table or the ball
// filter; only match setup spells the name out beside them, where the reader
// is choosing rather than recognising.

// The setup form's own labels, kept short because they sit inside a toggle.
const BALL_LABELS: Record<BallType, string> = {
  blue: "Blue",
  red: "Red",
  yellow: "Yellow",
  double_yellow: "Dbl yellow",
}

const BALLS = Object.keys(BALL_LABELS) as Array<BallType>

const meta = {
  title: "Broadcast/Ball dots",
  component: BallDots,
  args: { ball: "double_yellow" },
  argTypes: {
    ball: { control: "select", options: BALLS },
  },
} satisfies Meta<typeof BallDots>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// Unlabelled and side by side, as the filter and the match rows show them:
// four dot treatments that have to stay apart at a glance, at 8px across.
export const EveryBall: Story = {
  render: () => (
    <div className="flex items-center gap-5">
      {BALLS.map((ball) => (
        <BallDots key={ball} ball={ball} />
      ))}
    </div>
  ),
}

// Match setup is the one place the name is spelt out, because there the
// reader is picking a ball rather than recognising one already chosen.
export const AsSetupChips: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {BALLS.map((ball) => (
        <span
          key={ball}
          className="inline-flex items-center gap-2 border border-foreground/15 px-2.5 py-1.5 text-sm"
        >
          <BallDots ball={ball} />
          {BALL_LABELS[ball]}
        </span>
      ))}
    </div>
  ),
}
