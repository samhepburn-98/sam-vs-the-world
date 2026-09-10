import { StatBarRow } from "@/features/dashboard/components/profile/stat-bar-row"

import type { Meta, StoryObj } from "@storybook/react-vite"

// One labelled proportion as a row — the workhorse of the Stats tab's small
// panels (game phase, point-enders, errors given). Reach for it whenever a
// panel is a short list of comparable shares rather than a chart; `tone` is
// the whole trick, separating what was earned (accent) from what was leaked
// (loss red) without changing the shape.

const meta = {
  title: "Dashboard/Stat bar row",
  component: StatBarRow,
  args: { label: "From 9–all", pct: 64, value: "32 of 50" },
  render: (args) => (
    <div className="w-80">
      <StatBarRow {...args} />
    </div>
  ),
} satisfies Meta<typeof StatBarRow>

export default meta
type Story = StoryObj<typeof meta>

// The accent tone, for a share that was won: Sam's record from 9–all. The
// figure on the right carries the rallies it came from, so 64% off 50 is
// never mistaken for 64% off 5.
export const Earning: Story = {}

// The same row in loss red — the tin's share of the errors given away. Only
// the colour changes, and it is the colour that says this number is a cost
// rather than a return.
export const Leaking: Story = {
  args: { label: "Tin", pct: 33, value: "20", tone: "loss" },
}

// How the rows actually land: the By game phase panel, three rows deep, the
// last of them with no rallies to rate. The caller passes a dash and a zero
// width for an empty denominator — never a 0% that reads as a real result.
export const GamePhasePanel: Story = {
  name: "A game-phase panel",
  render: () => (
    <div className="w-80">
      <StatBarRow label="Early" pct={52} value="52 of 100" />
      <StatBarRow label="Mid" pct={50} value="40 of 80" />
      <StatBarRow label="From 9–all" pct={0} value="—" />
    </div>
  ),
}
