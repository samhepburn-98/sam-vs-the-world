import { PlayerCard } from "@/features/dashboard/components/shared/player-card"
import {
  heroStat,
  playerTrait,
} from "@/features/dashboard/lib/player-attributes"
import { headline, player } from "@/features/dashboard/lib/player-data.fixtures"

import {
  ALEX,
  ALEX_ATTRS,
  ALEX_DATA,
  ORMOND,
  SAM,
  SAM_ATTRS,
  SAM_DATA,
  THIN_ATTRS,
  THIN_DATA,
} from "#storybook/fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The crown jewel: the FUT-style player card, kept through the Broadcast
// redesign as the one crafted object against the flat studio graphics.
// Reach for it wherever a player is the subject rather than a row in a list —
// the roster's featured slot, both corners of the duel, a profile header.
// Every figure on the card is read off the shared cast the way the app reads
// it — the name and hand straight off the player, the win rate through
// heroStat, the banner through playerTrait, the six attributes through
// computePlayerAttributes — so this Sam is the same Sam as everywhere else in
// the sidebar, and no story can quietly hand him someone else's numbers.

// The cast's Alex, with the one change this story needs. The shared fixture
// gives him his own serve, rallies, errors and momentum but leaves the
// headline alone, so out of the box he prints Sam's win rate and Sam's trait —
// two players wearing one identity. Duel's story reaches for the same fix:
// give him a losing record and the trait his long rallies actually describe.
// Nothing the six attributes read is touched, so the grid is still the cast's.
const ALEX_ON_HIS_OWN_HEADLINE = player({
  ...ALEX_DATA,
  headline: headline({
    games_won: 16,
    games_decided: 40,
    matches_won: 5,
    matches_decided: 12,
    signature_trait: "wall",
  }),
})

const meta = {
  title: "Cards/Player card",
  component: PlayerCard,
  args: {
    name: SAM.name,
    side: "p1",
    // the cast carry no uploaded portraits, so they wear the app's own
    // silhouette — the same fallback computeProfileHeader hands the card
    avatarSrc: "/avatars/default.svg",
    trait: playerTrait(SAM_DATA),
    handedness: SAM.handedness,
    hero: heroStat(SAM_DATA),
    attrs: SAM_ATTRS,
  },
} satisfies Meta<typeof PlayerCard>

export default meta
type Story = StoryObj<typeof meta>

// The protagonist's side: ember frame, the win rate and the hand top left,
// the six attributes in two subgrid columns, the trait banner beneath them.
export const PlayerOne: Story = {
  name: "Player one",
  render: (args) => (
    <div className="w-52">
      <PlayerCard {...args} />
    </div>
  ),
}

// The opponent's side: the same card in blue, and a genuinely different
// player behind it — left-handed, a losing record, and a Wall where Sam is a
// Grinder, because his rallies run long and end on the other racket.
export const PlayerTwo: Story = {
  name: "Player two",
  args: {
    name: ALEX.name,
    side: "p2",
    handedness: ALEX.handedness,
    trait: playerTrait(ALEX_ON_HIS_OWN_HEADLINE),
    hero: heroStat(ALEX_ON_HIS_OWN_HEADLINE),
    attrs: ALEX_ATTRS,
  },
  render: (args) => (
    <div className="w-52">
      <PlayerCard {...args} />
    </div>
  ),
}

// Ormond, two games into his first night: the shared thin player, under every
// gate at once, so all six attributes read "—" and heroStat withholds the win
// rate with them. No banner either — the headline RPC calls no trait until it
// can, and a missing trait is more honest than an invented one.
export const UnderSampled: Story = {
  name: "Under-sampled",
  args: {
    name: ORMOND.name,
    handedness: ORMOND.handedness,
    // the RPC answers null this early; the thin fixture keeps the builder's
    // default trait, so the story states the null the app would send
    trait: null,
    hero: heroStat(THIN_DATA),
    attrs: THIN_ATTRS,
  },
  render: (args) => (
    <div className="w-52">
      <PlayerCard {...args} />
    </div>
  ),
}
