import { DuelCenter } from "@/features/dashboard/components/duel-center"
import {
  dominanceFromForm,
  dominanceFromH2h,
  duelTally,
} from "@/features/dashboard/lib/duel-scoring"
import { computePlayerAttributes } from "@/features/dashboard/lib/player-attributes"
import {
  error,
  headline,
  player,
} from "@/features/dashboard/lib/player-data.fixtures"

import { ALEX_DATA, SAM_ATTRS, SAM_DATA } from "#storybook/fixtures"

import type { DuelReceipt } from "@/features/dashboard/components/duel-center"
import type { H2hResult } from "@/features/dashboard/schemas/insights"
import type { Meta, StoryObj } from "@storybook/react-vite"

// The engine down the middle of the compare page: the score, the dominance
// split, the six attributes as diverging rows, the verdict panel and the
// receipts table of raw counts. It takes everything already computed — it
// derives nothing — so it can front a head-to-head record or a stat duel
// without knowing which it is.

// The cast's Alex with his control pulled back to the fixture's default error
// split — the one Sam is built from — so one of the six rows shows a tie that
// nobody wins. He keeps the rest of the shared shape: ahead on the return and
// the grind, behind on serve, attack and clutch.
const ALEX_LEVEL_ON_CONTROL_ATTRS = computePlayerAttributes(
  player({ ...ALEX_DATA, error: error() })
)
const TALLY = duelTally(SAM_ATTRS, ALEX_LEVEL_ON_CONTROL_ATTRS)

// Alex and Sam share a headline in the fixture, which puts dominance at a
// dead 50/50 and says nothing. A losing record is what this bar is for.
const ALEX_LOSING_HEADLINE = headline({ games_won: 16, games_decided: 40 })

// Their record, as the h2h RPC returns it.
const H2H: H2hResult = {
  games_won_p1: 24,
  games_won_p2: 19,
  games_decided: 43,
  matches_won_p1: 7,
  matches_won_p2: 5,
  matches_decided: 12,
  match_history: [],
}

// The raw counts under the rates — the duel assembles these from the same
// payloads that feed the attributes.
const RECEIPTS: Array<DuelReceipt> = [
  { label: "Games won", p1Value: "24", p2Value: "16" },
  { label: "Aces", p1Value: "6", p2Value: "2" },
  { label: "Double faults", p1Value: "2", p2Value: "7" },
  { label: "Comebacks", p1Value: "3", p2Value: "3" },
  { label: "Longest rally", p1Value: "34", p2Value: "41" },
  { label: "Tins", p1Value: "20", p2Value: "20" },
]

const meta = {
  title: "Dashboard/Duel centre",
  component: DuelCenter,
  args: {
    p1Name: "Sam",
    p2Name: "Alex",
    score: { ...TALLY, heading: "The duel", caption: "Stats won" },
    dominance: dominanceFromForm(SAM_DATA.headline, ALEX_LOSING_HEADLINE),
    p1Attrs: SAM_ATTRS,
    p2Attrs: ALEX_LEVEL_ON_CONTROL_ATTRS,
    tally: TALLY,
    receipts: RECEIPTS,
  },
} satisfies Meta<typeof DuelCenter>

export default meta
type Story = StoryObj<typeof meta>

// All games. The score at the top is the stat duel itself — how many of the
// six rows each player takes — and dominance is the two overall win rates
// set against each other, not a shared record.
export const AllGames: Story = {
  name: "All games",
  render: (args) => (
    <div className="w-full max-w-md">
      <DuelCenter {...args} />
    </div>
  ),
}

// Head to head. Same engine, different meaning: the score is now their real
// record and dominance is the share of the games they have actually played
// against each other.
export const HeadToHead: Story = {
  name: "Head to head",
  args: {
    score: {
      p1: H2H.matches_won_p1,
      p2: H2H.matches_won_p2,
      heading: "Full time",
      caption: "Matches won",
    },
    dominance: dominanceFromH2h(H2H),
  },
  render: (args) => (
    <div className="w-full max-w-md">
      <DuelCenter {...args} />
    </div>
  ),
}

// The honesty gate: head to head for a pair who have never met. Nothing is
// invented to fill the space — dominance is null so the split bar is gone
// entirely, every row is a dash, and the verdict is all square at 0–0 rather
// than a winner on a sample of nothing.
export const NoSharedGamesYet: Story = {
  name: "No shared games yet",
  args: {
    p2Name: "Ormond",
    score: { p1: 0, p2: 0, heading: "Full time", caption: "Matches won" },
    dominance: null,
    p1Attrs: computePlayerAttributes({}),
    p2Attrs: computePlayerAttributes({}),
    tally: { p1: 0, p2: 0 },
    receipts: RECEIPTS.map((r) => ({ ...r, p1Value: "—", p2Value: "—" })),
  },
  render: (args) => (
    <div className="w-full max-w-md">
      <DuelCenter {...args} />
    </div>
  ),
}
