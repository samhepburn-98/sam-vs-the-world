import { AttributeRadar } from "@/features/dashboard/components/shared/attribute-radar"

import { ALEX_ATTRS, SAM_ATTRS } from "#storybook/fixtures"

import type { PlayerAttribute } from "@/features/dashboard/lib/player-attributes"
import type { Meta, StoryObj } from "@storybook/react-vite"

// The same six attributes as the card grid, drawn as one shape — the read
// that lands in a second. Reach for it under a player card, or in both duel
// columns where two hexagons make two playing styles comparable side by side.
// An under-sampled axis collapses to the centre rather than inventing a value.

// Ormond has barely played: only the serve has cleared its sample threshold,
// so five of the six axes pull in to nothing.
const ORMOND_ATTRS: Array<PlayerAttribute> = SAM_ATTRS.map((a) =>
  a.key === "srv"
    ? a
    : {
        ...a,
        value: null,
        display: "—",
        sr: "not enough rallies yet",
      }
)

const meta = {
  title: "Dashboard/Attribute radar",
  component: AttributeRadar,
  args: { attrs: SAM_ATTRS, side: "p1", name: "Sam" },
} satisfies Meta<typeof AttributeRadar>

export default meta
type Story = StoryObj<typeof meta>

export const PlayerOne: Story = {
  name: "Player one",
  render: (args) => (
    <div className="w-64">
      <AttributeRadar {...args} />
    </div>
  ),
}

// How the duel page uses it: one radar per corner, ember against blue, both
// clamped to the same 0–100 scale so the shapes are honestly comparable.
export const DuelPair: Story = {
  name: "Duel pair",
  render: () => (
    <div className="grid max-w-lg grid-cols-2 gap-8">
      <AttributeRadar attrs={SAM_ATTRS} side="p1" name="Sam" />
      <AttributeRadar attrs={ALEX_ATTRS} side="p2" name="Alex" />
    </div>
  ),
}

export const NotEnoughData: Story = {
  name: "Not enough data",
  args: { attrs: ORMOND_ATTRS, name: "Ormond" },
  render: (args) => (
    <div className="w-64">
      <AttributeRadar {...args} />
    </div>
  ),
}
