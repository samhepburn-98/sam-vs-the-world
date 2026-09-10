import { RallyTable } from "@/features/dashboard/components/shared/rally-table"

import { withRouter } from "#storybook/decorators"
import { IDS } from "#storybook/fixtures"

import type { RallyScored } from "@/lib/schemas/rally"
import type { Meta, StoryObj } from "@storybook/react-vite"

// The receipts under a number: the actual rallies a stat was counted from,
// handed straight over by its `*_rallies` companion RPC. Reach for it at the
// bottom of any drill-through page. A row opens the detail sheet, which links
// on to the match — so the table needs the router even before anything opens.

const GAME_ID = "55555555-5555-4555-8555-555555555555"
const rallyId = (n: number) => `66666666-6666-4666-8666-00000000000${n}`

const rally = (over: Partial<RallyScored>): RallyScored => ({
  id: rallyId(0),
  game_id: GAME_ID,
  match_id: IDS.match,
  game_number: 2,
  date: "2026-07-14",
  ball_type: "double_yellow",
  player1_id: IDS.sam,
  player2_id: IDS.alex,
  server_id: IDS.sam,
  receiver_id: IDS.alex,
  rally_number: 1,
  serve_side: "right",
  serve_number: 1,
  winner_id: IDS.sam,
  end_reason: "winner",
  error_detail: null,
  forced: null,
  winning_shot: "drive",
  losing_shot: null,
  shot_count: 6,
  is_let: false,
  score_p1: 1,
  score_p2: 0,
  ...over,
})

// One game's worth of endings, in the order they happened: every outcome the
// column can print, a let that replays the score, and two rallies the logger
// never got a shot count for. The serve follows PAR — the winner serves next,
// a new server starts left, a retained one alternates — so the Serve column
// reads as a real sequence rather than six unrelated rows.
const RALLIES: Array<RallyScored> = [
  rally({
    id: rallyId(1),
    rally_number: 9,
    winning_shot: "drop",
    shot_count: 12,
    score_p1: 5,
    score_p2: 4,
  }),
  rally({
    id: rallyId(2),
    rally_number: 10,
    serve_side: "left",
    winner_id: IDS.alex,
    end_reason: "error",
    error_detail: "tin",
    forced: false,
    winning_shot: null,
    losing_shot: "drive",
    shot_count: 8,
    score_p1: 5,
    score_p2: 5,
  }),
  rally({
    id: rallyId(3),
    rally_number: 11,
    server_id: IDS.alex,
    receiver_id: IDS.sam,
    serve_side: "left",
    end_reason: "stroke",
    winning_shot: null,
    shot_count: 14,
    score_p1: 6,
    score_p2: 5,
  }),
  rally({
    id: rallyId(4),
    rally_number: 12,
    serve_side: "left",
    winner_id: null,
    end_reason: "let",
    winning_shot: null,
    shot_count: null,
    is_let: true,
    score_p1: 6,
    score_p2: 5,
  }),
  rally({
    id: rallyId(5),
    rally_number: 13,
    serve_side: "left",
    end_reason: "ace",
    winning_shot: null,
    shot_count: 1,
    score_p1: 7,
    score_p2: 5,
  }),
  rally({
    id: rallyId(6),
    rally_number: 14,
    serve_number: 2,
    winner_id: IDS.alex,
    end_reason: "serve_fault",
    winning_shot: null,
    shot_count: null,
    score_p1: 7,
    score_p2: 6,
  }),
]

const meta = {
  title: "Dashboard/Rally table",
  component: RallyTable,
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
    withRouter,
  ],
  args: { rallies: RALLIES, playerId: IDS.sam },
} satisfies Meta<typeof RallyTable>

export default meta
type Story = StoryObj<typeof meta>

// Sam's page, so the score reads Sam first. Click any row for the detail.
export const Default: Story = {}

// The same six rallies on Alex's page. The score column flips to put the page
// owner first — the rest of the row is the rally itself and never moves.
export const FromTheOtherSide: Story = {
  name: "From the other side",
  args: { playerId: IDS.alex },
}

// A filter can narrow a stat to nothing. The table says so on the court
// rather than collapsing, so the page keeps its shape while you widen again.
export const NoRalliesYet: Story = {
  name: "No rallies yet",
  args: { rallies: [] },
}
