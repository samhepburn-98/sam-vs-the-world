import { PlayerCard } from "@/features/dashboard/components/player-card"

import type { PlayerAttribute } from "@/features/dashboard/lib/player-attributes"
import type { Meta, StoryObj } from "@storybook/react-vite"

// The crown jewel: the FUT-style player card, kept through the Broadcast
// redesign as the one crafted object against the flat studio graphics.

const ATTRS = (
  values: Array<[string, string, number | null]>
): Array<PlayerAttribute> =>
  values.map(([code, detail, value]) => ({
    key: code.toLowerCase() as PlayerAttribute["key"],
    code,
    detail,
    value,
    display: value === null ? "—" : String(value),
    sr: `${detail} ${value ?? "under-sampled"}`,
  }))

const SAM_ATTRS = ATTRS([
  ["SRV", "serve points won", 58],
  ["RET", "return points won", 36],
  ["ATT", "attacking rallies won", 48],
  ["CON", "clean-finish share", 44],
  ["GRD", "extended rallies won", 45],
  ["CLU", "pressure points won", 43],
])

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
    name: "Ormond",
    side: "p2",
    trait: "shotmaker",
    hero: { display: "42%", label: "Win rate" },
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
    attrs: ATTRS([
      ["SRV", "serve points won", null],
      ["RET", "return points won", null],
      ["ATT", "attacking rallies won", null],
      ["CON", "clean-finish share", null],
      ["GRD", "extended rallies won", null],
      ["CLU", "pressure points won", null],
    ]),
  },
  render: (args) => (
    <div className="w-52">
      <PlayerCard {...args} />
    </div>
  ),
}
