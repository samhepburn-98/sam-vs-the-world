import { DuelAttributeRow } from "@/features/dashboard/components/compare/duel-attribute-row"
import { computePlayerAttributes } from "@/features/dashboard/lib/player-attributes"
import {
  error,
  player,
  serve,
} from "@/features/dashboard/lib/player-data.fixtures"

import { ALEX_ATTRS, ALEX_DATA, SAM_ATTRS } from "#storybook/fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"

// One attribute as a tug-of-war: two bars growing outward from the
// three-letter code in the middle, the winning side at full strength and the
// losing side faded. Six of them stacked are the spine of the duel's centre
// column — reach for it whenever two players' rates need setting against each
// other, and never for a single player's number.

// Every shape here is computed the way the app computes it, so the codes, the
// dashes and the screen-reader lines are the genuine article. The cast's Sam
// and Alex carry it: Alex is ahead on the return, control and the grind,
// behind on serve, attack and clutch.

// The one exception. Sam and Alex differ on all six by design, so the level
// row needs a deliberate tie: the shared Alex with his control rebuilt on the
// fixture's default error split, the one Sam is built from.
const ALEX_LEVEL_ON_CONTROL_ATTRS = computePlayerAttributes(
  player({ ...ALEX_DATA, error: error() })
)

// Ormond has no payload in the shared cast — he is here only to be
// under-sampled: eleven serve rallies, under the thirty the app needs before
// it will print a rate.
const ORMOND_THIN_ATTRS = computePlayerAttributes(
  player({
    serve: serve({
      rallies_served: 11,
      serve_wins: 6,
      rallies_returned: 9,
      return_wins: 4,
    }),
  })
)

const meta = {
  title: "Dashboard/Duel attribute row",
  component: DuelAttributeRow,
  args: { p1Attr: SAM_ATTRS[0], p2Attr: ALEX_ATTRS[0] },
} satisfies Meta<typeof DuelAttributeRow>

export default meta
type Story = StoryObj<typeof meta>

// Serve: Sam is plainly ahead, so his number takes the ember and his bar
// runs at full strength while Alex's fades.
export const PlayerOneAhead: Story = {
  name: "Player one ahead",
  render: (args) => (
    <div className="w-80">
      <DuelAttributeRow {...args} />
    </div>
  ),
}

// Return: the same row with the win on the other side — blue at full
// strength, ember faded.
export const PlayerTwoAhead: Story = {
  name: "Player two ahead",
  args: { p1Attr: SAM_ATTRS[1], p2Attr: ALEX_ATTRS[1] },
  render: (args) => (
    <div className="w-80">
      <DuelAttributeRow {...args} />
    </div>
  ),
}

// Dead level on control. Nobody wins the row, so both numbers stay muted and
// both bars stay faded — a tie is not a half-win to either side.
export const LevelPegging: Story = {
  name: "Level pegging",
  args: { p1Attr: SAM_ATTRS[3], p2Attr: ALEX_LEVEL_ON_CONTROL_ATTRS[3] },
  render: (args) => (
    <div className="w-80">
      <DuelAttributeRow {...args} />
    </div>
  ),
}

// The honesty gate. Ormond's sample is too small to rate, so his side is a
// dash with no bar — and Sam does not win the row by default: with one side
// unmeasured there is nothing to compare, so his bar stays faded too.
export const NotEnoughRalliesYet: Story = {
  name: "Not enough rallies yet",
  args: { p1Attr: SAM_ATTRS[0], p2Attr: ORMOND_THIN_ATTRS[0] },
  render: (args) => (
    <div className="w-80">
      <DuelAttributeRow {...args} />
    </div>
  ),
}

// All six, as the duel stacks them. Each row scales against its own maximum,
// so every row fills the width and the shape of the contest reads down the
// column rather than across a common axis.
export const TheSixRows: Story = {
  name: "The six rows",
  render: () => (
    <div className="flex w-80 flex-col gap-3.5">
      {SAM_ATTRS.map((attr, i) => (
        <DuelAttributeRow key={attr.key} p1Attr={attr} p2Attr={ALEX_ATTRS[i]} />
      ))}
    </div>
  ),
}
