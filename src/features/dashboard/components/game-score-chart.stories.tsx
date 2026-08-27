import { GameScoreChart } from "@/features/dashboard/components/game-score-chart"

import { IDS } from "#storybook/fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"
import type { RallyScored } from "@/lib/schemas/rally"

// One game's score race: a running-score line per player, one x step per
// rally. Reach for it on a match page under each game's heading — it answers
// "was it close?" before any number is read. Fed the folded rallies_scored
// rows the match already has, so it needs no query of its own.

/** A game written as a rally script — "1" and "2" are the point winners, "L"
 *  a let — folded into the running score the `rallies_scored` view returns. */
function game(script: string): Array<RallyScored> {
  let p1 = 0
  let p2 = 0
  return Array.from(script).map((outcome, i) => {
    if (outcome === "1") p1 += 1
    if (outcome === "2") p2 += 1
    const isLet = outcome === "L"
    return {
      id: `rally-${i + 1}`,
      game_id: "game-1",
      match_id: IDS.match,
      game_number: 1,
      date: "2026-07-14",
      rally_number: i + 1,
      server_id: IDS.sam,
      receiver_id: IDS.alex,
      serve_side: "right",
      serve_number: 1,
      winner_id: isLet ? null : outcome === "1" ? IDS.sam : IDS.alex,
      end_reason: isLet ? "let" : "winner",
      error_detail: null,
      forced: null,
      winning_shot: null,
      losing_shot: null,
      shot_count: 7,
      ball_type: "double_yellow",
      player1_id: IDS.sam,
      player2_id: IDS.alex,
      is_let: isLet,
      score_p1: p1,
      score_p2: p2,
    }
  })
}

const meta = {
  title: "Dashboard/Game score chart",
  component: GameScoreChart,
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  args: {
    rows: game("12122L12112212121L1211"),
    p1Name: "Sam",
    p2Name: "Alex",
  },
} satisfies Meta<typeof GameScoreChart>

export default meta
type Story = StoryObj<typeof meta>

// Sam wins it 11–9: the two lines stay knotted together the whole way.
export const CloseGame: Story = {
  name: "Close game",
}

// The other shape a game takes — 11–2, the lines split by the third rally and
// the gap never closing again.
export const OneSidedGame: Story = {
  name: "One-sided game",
  args: { rows: game("1112111111211") },
}

// A let costs a rally but no point, so both lines go flat across it. Six of
// them here, and the plateaus are the chart telling the truth about how long
// the game actually took.
export const LetStrewnGame: Story = {
  name: "Let-strewn game",
  args: { rows: game("12LL112121L1212L1212LL11") },
}
