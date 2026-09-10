import { PlayerCardFooter } from "@/features/dashboard/components/compare/player-card-footer"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The two flourishes that sit under a player card in a duel: the trait line
// naming the player's class in their own colour, and the pills they earned by
// plainly beating the other player in a category. Both are earned, so both
// can be empty — this is not a place to invent a label.

const meta = {
  title: "Dashboard/Player card footer",
  component: PlayerCardFooter,
  args: {
    name: "Sam",
    trait: "grinder",
    pills: ["Iron nerve", "Big server"],
    side: "p1",
  },
} satisfies Meta<typeof PlayerCardFooter>

export default meta
type Story = StoryObj<typeof meta>

// Player one, so the trait burns ember. Two pills is the cap: a player who
// wins every category still only carries the first two.
export const PlayerOne: Story = {
  name: "Player one",
  render: (args) => (
    <div className="w-56">
      <PlayerCardFooter {...args} />
    </div>
  ),
}

// Player two takes the same footer in blue — the colour is the only thing
// that says which corner this line belongs to.
export const PlayerTwo: Story = {
  name: "Player two",
  args: {
    name: "Alex",
    trait: "sniper",
    pills: ["Comeback king", "Shot machine"],
    side: "p2",
  },
  render: (args) => (
    <div className="w-56">
      <PlayerCardFooter {...args} />
    </div>
  ),
}

// A newcomer: no trait called yet, and no category won outright. The chip
// drops out of the line — leaving the bare "Ormond · measured" — and the
// pills disappear rather than showing empty slots.
export const NothingEarnedYet: Story = {
  name: "Nothing earned yet",
  args: { name: "Ormond", trait: null, pills: [] },
  render: (args) => (
    <div className="w-56">
      <PlayerCardFooter {...args} />
    </div>
  ),
}
