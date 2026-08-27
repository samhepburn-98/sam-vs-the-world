import { H2hPanel } from "@/features/dashboard/components/h2h-panel"

import { withAppContext } from "#storybook/decorators"
import { IDS } from "#storybook/fixtures"

import type { H2hResult } from "@/features/dashboard/schemas/insights"
import type { RallyScored } from "@/lib/schemas/rally"
import type { Meta, StoryObj } from "@storybook/react-vite"

// The pair's record on /compare, and the way underneath it. Everything above
// the disclosure is an aggregate; opening it fetches the rallies those numbers
// were counted from, so the list can never disagree with them.

const GAME = "55555555-5555-4555-8555-555555555555"

const rally = (n: number): RallyScored => ({
  id: `66666666-6666-4666-8666-00000000000${n}`,
  game_id: GAME,
  match_id: IDS.match,
  game_number: 1,
  date: "2026-06-02",
  ball_type: "double_yellow",
  player1_id: IDS.sam,
  player2_id: IDS.alex,
  server_id: n % 2 === 0 ? IDS.sam : IDS.alex,
  receiver_id: n % 2 === 0 ? IDS.alex : IDS.sam,
  rally_number: n,
  serve_side: n % 2 === 0 ? "left" : "right",
  serve_number: 1,
  winner_id: n % 3 === 0 ? IDS.alex : IDS.sam,
  end_reason: n % 3 === 0 ? "error" : "winner",
  error_detail: n % 3 === 0 ? "tin" : null,
  forced: n % 3 === 0 ? true : null,
  winning_shot: n % 3 === 0 ? null : "drop",
  losing_shot: n % 3 === 0 ? "drive" : null,
  shot_count: 4 + n,
  is_let: false,
  score_p1: n,
  score_p2: Math.max(0, n - 2),
})

const RALLIES = Array.from({ length: 6 }, (_, i) => rally(i + 1))

const matchId = (n: number) => `44444444-4444-4444-8444-00000000000${n}`

// All four outcomes the column can print. A draw and a match still being
// logged are different things: the draw takes the D chip, the pending one
// takes no chip at all, because "in play" is not a result.
const MET: H2hResult = {
  games_won_p1: 12,
  games_won_p2: 8,
  games_decided: 20,
  matches_won_p1: 4,
  matches_won_p2: 2,
  matches_decided: 6,
  match_history: [
    {
      match_id: IDS.match,
      date: "2026-06-02",
      games_won_p1: 3,
      games_won_p2: 1,
      winner_id: IDS.sam,
      outcome: "p1",
    },
    {
      match_id: matchId(2),
      date: "2026-07-11",
      games_won_p1: 1,
      games_won_p2: 3,
      winner_id: IDS.alex,
      outcome: "p2",
    },
    {
      match_id: matchId(3),
      date: "2026-08-03",
      games_won_p1: 2,
      games_won_p2: 2,
      winner_id: null,
      outcome: "draw",
    },
    {
      match_id: matchId(4),
      date: "2026-08-19",
      games_won_p1: 1,
      games_won_p2: 1,
      winner_id: null,
      outcome: "pending",
    },
  ],
}

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
  title: "Dashboard/Head-to-head panel",
  component: H2hPanel,
  parameters: { layout: "padded" },
  decorators: withAppContext((queryClient) => {
    queryClient.setQueryData(["insights", "h2h", IDS.sam, IDS.alex, {}], MET)
    queryClient.setQueryData(
      ["insights", "h2h-rallies", IDS.sam, IDS.alex, {}],
      RALLIES
    )
  }),
  args: {
    player1Id: IDS.sam,
    player2Id: IDS.alex,
    p1Name: "Sam",
    p2Name: "Alex",
  },
} satisfies Meta<typeof H2hPanel>

export default meta
type Story = StoryObj<typeof meta>

// The record, the history, and the way in. The drill-through stays closed
// until asked for — a pair's whole rally history is a lot to fetch for a
// panel most visits never expand. Click it to open the table.
export const Default: Story = {}

// Two players who have never met. The honest note, and nothing to drill.
export const NeverMet: Story = {
  name: "Never met",
  decorators: withAppContext((queryClient) => {
    queryClient.setQueryData(
      ["insights", "h2h", IDS.sam, IDS.alex, {}],
      NEVER_MET
    )
  }),
}
