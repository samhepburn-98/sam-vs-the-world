import { RosterRow } from "@/features/dashboard/components/roster-row"
import { headline, player } from "@/features/dashboard/lib/player-data.fixtures"

import { withAppContext } from "#storybook/decorators"
import {
  ALEX,
  ALEX_DATA,
  IDS,
  ORMOND,
  SAM,
  SAM_DATA,
} from "#storybook/fixtures"

import type { PlayerData } from "@/features/dashboard/lib/player-attributes"
import type { Meta, StoryObj } from "@storybook/react-vite"
import type { QueryClient } from "@tanstack/react-query"

// One player as a broadcast line: side-coloured bar, name, trait tag, recent
// form, win rate. Reach for it for any list of people — the home roster is
// the only caller today. Identity is a prop; the trait and rate come from
// the same insight payloads every other surface reads, through the hook.

/** The six insight queries `usePlayerInsights` runs, seeded under their exact
 *  keys so the row renders its loaded state with no network. */
function seedInsights(
  queryClient: QueryClient,
  playerId: string,
  data: PlayerData
) {
  const filters = {}
  queryClient.setQueryData(
    ["insights", "player-headline", playerId, filters],
    data.headline
  )
  queryClient.setQueryData(
    ["insights", "serve-stats", playerId, filters],
    data.serve
  )
  queryClient.setQueryData(
    ["insights", "error-profile", playerId, filters],
    data.error
  )
  queryClient.setQueryData(
    ["insights", "rally-lengths", playerId, filters],
    data.rally
  )
  // momentum carries a deficit argument; the profile hook passes none
  queryClient.setQueryData(
    ["insights", "momentum", playerId, filters, null],
    data.momentum
  )
  queryClient.setQueryData(
    ["insights", "decisive-shots", playerId, filters],
    data.decisive
  )
}

/** Ormond has played two decided games — under the five a win rate needs,
 *  and too little for the SQL to call a trait. */
const ORMOND_DATA = player({
  headline: headline({
    games_won: 1,
    games_decided: 2,
    signature_trait: null,
  }),
})

const meta = {
  title: "Dashboard/Roster row",
  component: RosterRow,
  decorators: withAppContext((queryClient) => {
    seedInsights(queryClient, IDS.sam, SAM_DATA)
    seedInsights(queryClient, IDS.alex, ALEX_DATA)
    seedInsights(queryClient, IDS.ormond, ORMOND_DATA)
  }),
  args: { player: SAM, side: "p1", form: ["l", "w", "w", "d", "w"] },
  render: (args) => (
    <div className="w-full max-w-xl">
      <RosterRow {...args} />
    </div>
  ),
} satisfies Meta<typeof RosterRow>

export default meta
type Story = StoryObj<typeof meta>

// A player with enough behind them for every slot to fill: the trait is
// called, the form guide is full, and the win rate is a real percentage.
export const PlayerOne: Story = {
  name: "Player one",
}

// How home draws it: sides alternate down the list, so the bars read as a
// rhythm rather than a claim about who is player one.
export const TheRoster: Story = {
  name: "The roster",
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-1.5">
      <RosterRow player={SAM} side="p1" form={["l", "w", "w", "d", "w"]} />
      <RosterRow player={ALEX} side="p2" form={["w", "l", "l", "w", "l"]} />
      <RosterRow player={ORMOND} side="p1" form={["l", "w"]} />
    </div>
  ),
}

// A player two games old: the win rate is a quiet dash rather than "50%" off
// one win, no trait has been called, and the form guide shows only what has
// actually been played.
export const NotEnoughData: Story = {
  name: "Not enough data",
  args: { player: ORMOND, side: "p2", form: ["l", "w"] },
}
