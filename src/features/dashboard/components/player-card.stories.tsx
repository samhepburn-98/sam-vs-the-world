import { PlayerCard } from "@/features/dashboard/components/player-card"

import { ALEX_ATTRS, SAM_ATTRS, THIN_ATTRS } from "#storybook/fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The crown jewel: the FUT-style player card, kept through the Broadcast
// redesign as the one crafted object against the flat studio graphics.
// Reach for it wherever a player is the subject rather than a row in a list —
// the roster's featured slot, both corners of the duel, a profile header.
// Attributes come from the shared cast, so this Sam is the same Sam as
// everywhere else in the sidebar.

const meta = {
  title: "Cards/Player card",
  component: PlayerCard,
  args: {
    name: "Sam",
    side: "p1",
    avatarSrc: "/avatars/default.svg",
    trait: "grafter",
    handedness: "right",
    hero: { display: "35%", label: "Win rate" },
    attrs: SAM_ATTRS,
  },
} satisfies Meta<typeof PlayerCard>

export default meta
type Story = StoryObj<typeof meta>

export const PlayerOne: Story = {
  render: (args) => (
    <div className="w-52">
      <PlayerCard {...args} />
    </div>
  ),
}

export const PlayerTwo: Story = {
  args: {
    name: "Alex",
    side: "p2",
    trait: "wall",
    hero: { display: "42%", label: "Win rate" },
    attrs: ALEX_ATTRS,
  },
  render: (args) => (
    <div className="w-52">
      <PlayerCard {...args} />
    </div>
  ),
}

export const UnderSampled: Story = {
  args: {
    name: "New player",
    trait: null,
    hero: { display: "—", label: "Win rate" },
    // the shared thin player: under every gate, so all six read "—"
    attrs: THIN_ATTRS,
  },
  render: (args) => (
    <div className="w-52">
      <PlayerCard {...args} />
    </div>
  ),
}
