import { Duel } from "@/features/dashboard/components/duel"
import {
  error,
  headline,
  player,
} from "@/features/dashboard/lib/player-data.fixtures"

import { withQueryClient } from "#storybook/decorators"
import {
  ALEX,
  ALEX_DATA,
  IDS,
  ORMOND,
  SAM,
  SAM_DATA,
} from "#storybook/fixtures"

import type { H2hResult } from "@/features/dashboard/schemas/insights"
import type { Meta, StoryObj } from "@storybook/react-vite"

// The whole compare page in one component: a card, radar and pills for each
// player flanking the centre engine. This is the assembled matchup — reach
// for the pieces (player card, duel centre, duel attribute row) when you want
// one of them somewhere else. It fetches the head-to-head record itself, so a
// story has to seed that query.

// The cast's Alex, with two changes this story needs and nothing else. His
// headline is Sam's out of the fixture, which splits dominance exactly down
// the middle and prints the same win rate and trait on both cards — so here
// he carries a losing record and the trait his rallies actually describe.
// And his control is pulled back to the fixture's default error split, the
// one Sam is built from, so one of the six rows shows a tie: nobody wins it,
// both sides stay muted. Everything else is the shared Alex — ahead on the
// return and the grind, behind on serve, attack and clutch.
const ALEX_LOSING_AND_LEVEL_ON_CONTROL = player({
  ...ALEX_DATA,
  headline: headline({
    games_won: 16,
    games_decided: 40,
    matches_won: 5,
    matches_decided: 12,
    signature_trait: "wall",
  }),
  error: error(),
})

const SAM_V_ALEX: H2hResult = {
  games_won_p1: 24,
  games_won_p2: 19,
  games_decided: 43,
  matches_won_p1: 7,
  matches_won_p2: 5,
  matches_decided: 12,
  match_history: [],
}

// Sam and Ormond have never played each other: the h2h RPC answers with
// zeros rather than nothing at all.
const NEVER_MET: H2hResult = {
  games_won_p1: 0,
  games_won_p2: 0,
  games_decided: 0,
  matches_won_p1: 0,
  matches_won_p2: 0,
  matches_decided: 0,
  match_history: [],
}

const meta = {
  title: "Dashboard/Duel",
  component: Duel,
  // useH2h reads ["insights", "h2h", p1, p2, filters] — seed both pairs so
  // either matchup renders its loaded state with no network.
  decorators: [
    withQueryClient((queryClient) => {
      queryClient.setQueryData(
        ["insights", "h2h", IDS.sam, IDS.alex, {}],
        SAM_V_ALEX
      )
      queryClient.setQueryData(
        ["insights", "h2h", IDS.sam, IDS.ormond, {}],
        NEVER_MET
      )
    }),
  ],
  args: {
    p1: SAM,
    p2: ALEX,
    p1Data: SAM_DATA,
    p2Data: ALEX_LOSING_AND_LEVEL_ON_CONTROL,
    mode: "all",
  },
} satisfies Meta<typeof Duel>

export default meta
type Story = StoryObj<typeof meta>

// All games: each player's overall form. The score is the stat duel — the
// rows each player takes — and dominance sets the two win rates against each
// other. The head-to-head record is not consulted at all.
export const AllGames: Story = {
  name: "All games",
  render: (args) => (
    <div className="w-full max-w-4xl">
      <Duel {...args} />
    </div>
  ),
}

// Head to head: the score becomes their real record and the caption changes
// with it. In the app every stat below is refetched through the opponent
// filter, so the cards read only the games these two have shared.
export const HeadToHead: Story = {
  name: "Head to head",
  args: { mode: "h2h" },
  render: (args) => (
    <div className="w-full max-w-4xl">
      <Duel {...args} />
    </div>
  ),
}

// Nothing to compare yet — a head to head between two players who have never
// met. Every insight payload is empty, which is exactly what the page holds
// before the numbers land: hero rates, card stats and rows all dash, both
// radars collapse to the centre, the dominance bar is gone and the verdict is
// all square rather than a winner.
export const NoSharedGamesYet: Story = {
  name: "No shared games yet",
  args: { p2: ORMOND, p1Data: {}, p2Data: {}, mode: "h2h" },
  render: (args) => (
    <div className="w-full max-w-4xl">
      <Duel {...args} />
    </div>
  ),
}
